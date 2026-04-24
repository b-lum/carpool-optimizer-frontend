// optimize.js
// Graph-based carpool optimizer.
//
// Strategy:
//   1. Build a pairwise haversine distance matrix for all unassigned people (O(N²), instant)
//   2. Cluster people using a greedy BFS — seed each cluster from the most isolated person,
//      expand by pulling in the nearest unclustered neighbors until the cluster hits a size
//      that fits a car. This naturally groups people who live close together.
//   3. Assign each cluster to the best car using a combined cost:
//        distance(cluster centroid → driver) + STOP_PENALTY_KM × existing stops on car
//   4. Order each car's pickup stops with nearest-neighbor TSP (same as before)
//
// Tuning constants
const STOP_PENALTY_KM = 15   // km-equivalent penalty per existing stop on a car
const CLUSTER_RADIUS_KM = 1.5 // max km radius to pull neighbors into a cluster
const SOFT_STOP_CAP = 2
const HARD_STOP_CAP = 4

// ── Haversine distance (km) ───────────────────────────────────────────────────
function distance(a, b) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// ── Centroid of a group of people ────────────────────────────────────────────
function centroid(people) {
  const lat = people.reduce((s, p) => s + p.lat, 0) / people.length
  const lon = people.reduce((s, p) => s + p.lon, 0) / people.length
  return { lat, lon }
}

// ── Build NxN distance matrix, keyed by email ────────────────────────────────
function buildDistanceMatrix(people) {
  // matrix.get(emailA).get(emailB) = km between A and B
  const matrix = new Map()
  for (const a of people) {
    const row = new Map()
    for (const b of people) {
      row.set(b.email, a.email === b.email ? 0 : distance(a, b))
    }
    matrix.set(a.email, row)
  }
  return matrix
}

// ── Greedy BFS clustering ─────────────────────────────────────────────────────
// Groups unassigned people into clusters where everyone is within
// CLUSTER_RADIUS_KM of at least one other cluster member.
// Clusters are capped at maxSize so they fit in a car.
function clusterPeople(people, matrix, maxClusterSize) {
  const unclustered = new Set(people.map(p => p.email))
  const byEmail = new Map(people.map(p => [p.email, p]))
  const clusters = []

  while (unclustered.size > 0) {
    // Seed: pick the person who is farthest from all other unclustered people
    // (most isolated) — this prevents large isolated outliers from being absorbed
    // into a cluster they don't really belong in.
    let seedEmail = null
    let maxMinDist = -1

    for (const emailA of unclustered) {
      let minDist = Infinity
      for (const emailB of unclustered) {
        if (emailA === emailB) continue
        const d = matrix.get(emailA).get(emailB)
        if (d < minDist) minDist = d
      }
      if (minDist === Infinity) minDist = 0 // only one person left
      if (minDist > maxMinDist) {
        maxMinDist = minDist
        seedEmail = emailA
      }
    }

    // BFS expand: pull in neighbors within CLUSTER_RADIUS_KM, up to maxClusterSize
    const cluster = [byEmail.get(seedEmail)]
    unclustered.delete(seedEmail)

    // Use a priority queue (sorted array) of candidates by distance to cluster
    // Re-evaluate after each addition so the cluster grows tightly
    let expanded = true
    while (expanded && cluster.length < maxClusterSize) {
      expanded = false
      let bestEmail = null
      let bestDist = Infinity

      for (const candidate of unclustered) {
        // Distance from candidate to nearest cluster member
        let nearestDist = Infinity
        for (const member of cluster) {
          const d = matrix.get(candidate).get(member.email)
          if (d < nearestDist) nearestDist = d
        }
        if (nearestDist <= CLUSTER_RADIUS_KM && nearestDist < bestDist) {
          bestDist = nearestDist
          bestEmail = candidate
        }
      }

      if (bestEmail) {
        cluster.push(byEmail.get(bestEmail))
        unclustered.delete(bestEmail)
        expanded = true
      }
    }

    clusters.push(cluster)
  }

  return clusters
}

// ── Car assignment cost ───────────────────────────────────────────────────────
function assignmentCost(car, clusterCentroid, currentStops) {
  const dist = distance(clusterCentroid, car.driver)
  return dist + currentStops * STOP_PENALTY_KM
}

// ── Main export ───────────────────────────────────────────────────────────────
export function optimizeCarpool(cars, roster, destination, mode = 'pickup') {

  // ── 1. Clone cars ─────────────────────────────────────────────────────────
  const assigned = cars.map(c => ({
    ...c,
    passengers: [...c.passengers],
  }))

  // ── 2. Build set of already-assigned emails ───────────────────────────────
  const assignedEmails = new Set()
  for (const car of assigned) {
    if (car.driver.email) assignedEmails.add(car.driver.email)
    for (const p of car.passengers) {
      if (p.email) assignedEmails.add(p.email)
    }
  }

  // ── 3. Get unassigned people ──────────────────────────────────────────────
  const unassigned = roster.filter(p =>
    p.email && !assignedEmails.has(p.email) &&
    p.lat != null && p.lon != null &&
    !isNaN(p.lat) && !isNaN(p.lon)
  )

  if (unassigned.length === 0) return assigned

  // ── 4. Build distance matrix ──────────────────────────────────────────────
  const matrix = buildDistanceMatrix(unassigned)

  // ── 5. Cluster unassigned people ──────────────────────────────────────────
  // Max cluster size = largest car capacity - 1 (driver doesn't count)
  const maxCarPassengers = Math.max(...assigned.map(c => c.capacity - 1), 1)
  const clusters = clusterPeople(unassigned, matrix, maxCarPassengers)

  // Sort clusters largest → smallest so big groups get first pick of cars
  clusters.sort((a, b) => b.length - a.length)

  // ── 6. Helpers ────────────────────────────────────────────────────────────
  const openSeats = car => car.capacity - 1 - car.passengers.length

  const stopCount = car => {
    const locs = new Set(car.passengers.map(p => `${p.lat?.toFixed(3)},${p.lon?.toFixed(3)}`))
    return locs.size
  }

  function findBestCar(cluster, stopCeiling) {
    const c = centroid(cluster)
    let bestCar = null
    let bestCost = Infinity

    for (const car of assigned) {
      if (openSeats(car) < cluster.length) continue
      if (stopCount(car) + 1 > stopCeiling) continue
      const cost = assignmentCost(car, c, stopCount(car))
      if (cost < bestCost) {
        bestCost = cost
        bestCar = car
      }
    }
    return bestCar
  }

  // ── 7. Assign clusters to cars ────────────────────────────────────────────
  const queue = [...clusters]

  while (queue.length > 0) {
    const cluster = queue.shift()

    // Pass 1: whole cluster fits, under soft cap
    let bestCar = findBestCar(cluster, SOFT_STOP_CAP)
    // Pass 2: relax to hard cap
    if (!bestCar) bestCar = findBestCar(cluster, HARD_STOP_CAP)
    // Pass 3: ignore stop cap entirely (last resort)
    if (!bestCar) bestCar = findBestCar(cluster, Infinity)

    if (bestCar) {
      for (const p of cluster) bestCar.passengers.push(p)
      continue
    }

    // No car fits the whole cluster — partial fill the best available car,
    // re-queue the remainder as a new (smaller) cluster
    let partialCar = null
    let bestPartialCost = Infinity
    const c = centroid(cluster)

    for (const car of assigned) {
      const open = openSeats(car)
      if (open <= 0) continue
      const cost = assignmentCost(car, c, stopCount(car))
      if (cost < bestPartialCost) {
        bestPartialCost = cost
        partialCar = car
      }
    }

    if (partialCar) {
      const open = openSeats(partialCar)
      const toAdd = cluster.slice(0, open)
      const remainder = cluster.slice(open)
      for (const p of toAdd) partialCar.passengers.push(p)
      if (remainder.length > 0) queue.push(remainder)
    }
    // if truly no seats anywhere, these people stay unassigned
  }

  // ── 8. Order pickup stops with nearest-neighbor TSP ───────────────────────
  // pickup:  driver → nearest passenger → ... → destination
  // dropoff: destination → nearest passenger → ... → driver home
  for (const car of assigned) {
    if (car.passengers.length === 0) continue

    const ordered = []
    let current = mode === 'dropoff' ? destination : car.driver
    const remaining = [...car.passengers]

    while (remaining.length > 0) {
      let nearestIdx = 0
      let nearestDist = Infinity
      for (let i = 0; i < remaining.length; i++) {
        const d = distance(current, remaining[i])
        if (d < nearestDist) {
          nearestDist = d
          nearestIdx = i
        }
      }
      ordered.push(remaining[nearestIdx])
      current = remaining[nearestIdx]
      remaining.splice(nearestIdx, 1)
    }

    car.passengers = ordered
  }

  return assigned
}