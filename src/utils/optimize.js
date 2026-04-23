// optimize.js
// Fills remaining empty seats in cars with unassigned people.
//   - Keeps existing manual passenger assignments intact
//   - Only assigns truly unassigned people to open seats
//   - Prefers cars under the stop cap (soft cap: 2 stops, hard cap: 3)
//   - Uses a combined cost: distance to driver + penalty per existing stop
//   - Orders pickup stops with nearest-neighbor routing

// STOP_PENALTY: km-equivalent cost added per existing stop on a car.
// e.g. 20 means "one extra stop feels like being 20km farther away"
const STOP_PENALTY_KM = 20

// Soft cap: try not to exceed this many stops per car
const SOFT_STOP_CAP = 2

// Hard cap: never exceed this many stops per car (unless no other option)
const HARD_STOP_CAP = 3

function distance(a, b) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Combined cost: distance to driver + penalty for each stop already on the car.
// Adding this group would add 1 new stop (all people in a location bucket = 1 stop).
function cost(car, representative) {
  const dist = distance(representative, car.driver)
  const stopPenalty = car.passengers.length * STOP_PENALTY_KM
  return dist + stopPenalty
}

export function optimizeCarpool(cars, roster, destination, mode = 'pickup') {

  // ── 1. Clone cars, preserving existing passenger assignments ──────────────
  const assigned = cars.map(c => ({
    ...c,
    passengers: [...c.passengers],
  }))

  // ── 2. Build set of already-assigned names ────────────────────────────────
  const assignedNames = new Set()
  for (const car of assigned) {
    assignedNames.add(car.driver.name)
    for (const p of car.passengers) assignedNames.add(p.name)
  }

  // ── 3. Group unassigned people by location ────────────────────────────────
  // Round to ~100m precision so people at the "same" address bucket together.
  // Each bucket = 1 stop, regardless of how many people are in it.
  const locationKey = p => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`

  const buckets = new Map()
  for (const person of roster) {
    if (assignedNames.has(person.name)) continue
    const key = locationKey(person)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(person)
  }

  // ── 4. Sort groups largest → smallest ────────────────────────────────────
  const groups = [...buckets.values()].sort((a, b) => b.length - a.length)

  // ── 5. Helpers ────────────────────────────────────────────────────────────
  const openSeats = car => car.capacity - 1 - car.passengers.length

  // stopCount: number of *distinct location stops* already on the car.
  // Since all people in a bucket share a location, count unique locations.
  const stopCount = car => {
    const locs = new Set(car.passengers.map(p => locationKey(p)))
    return locs.size
  }

  // Find the best car for a group, subject to a stop ceiling.
  // Returns { car, cost } or null if no eligible car found.
  function findBestCar(group, stopCeiling) {
    const representative = group[0]
    let bestCar = null
    let bestCost = Infinity

    for (const car of assigned) {
      if (openSeats(car) < group.length) continue
      // Adding this group adds 1 new stop (they all share a location)
      if (stopCount(car) + 1 > stopCeiling) continue

      const c = cost(car, representative)
      if (c < bestCost) {
        bestCost = c
        bestCar = car
      }
    }

    return bestCar
  }

  // ── 6. Assign groups to cars ──────────────────────────────────────────────
  // Strategy per group:
  //   Pass 1: find a car under SOFT_STOP_CAP with enough seats (combined cost)
  //   Pass 2: relax to HARD_STOP_CAP
  //   Pass 3: partial fill — same two-pass logic, fill what fits, re-queue rest
  const queue = [...groups]

  while (queue.length > 0) {
    const group = queue.shift()
    const representative = group[0]

    // Pass 1: whole group fits, under soft cap
    let bestCar = findBestCar(group, SOFT_STOP_CAP)

    // Pass 2: whole group fits, relax to hard cap
    if (!bestCar) bestCar = findBestCar(group, HARD_STOP_CAP)

    if (bestCar) {
      for (const p of group) bestCar.passengers.push(p)
      continue
    }

    // Pass 3: nobody fits the whole group — partial fill with same stop logic.
    // Try soft cap first, then hard cap.
    let partialCar = null
    let bestPartialCost = Infinity

    for (const stopCeiling of [SOFT_STOP_CAP, HARD_STOP_CAP]) {
      for (const car of assigned) {
        const open = openSeats(car)
        if (open <= 0) continue
        if (stopCount(car) + 1 > stopCeiling) continue

        const c = cost(car, representative)
        if (c < bestPartialCost) {
          bestPartialCost = c
          partialCar = car
        }
      }
      if (partialCar) break // found one under soft cap, no need to try hard cap
    }

    if (partialCar) {
      const open = openSeats(partialCar)
      const toAdd = group.slice(0, open)
      const remainder = group.slice(open)
      for (const p of toAdd) partialCar.passengers.push(p)
      if (remainder.length > 0) queue.push(remainder)
    }
    // if truly no car has any open seats, these people go unassigned
  }

  // ── 7. Order pickup stops with nearest-neighbor for each car ──────────────
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
        const dist = distance(current, remaining[i])
        if (dist < nearestDist) {
          nearestDist = dist
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