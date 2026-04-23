// OptimizeButton.jsx
// Fills remaining empty car seats with unassigned people (like Lineup.fill()),
// then calls the routing API for each car.
// onAssigned(assignedCars) fires before routing so the CarGrids update immediately.

import axios from 'axios'
import { optimizeCarpool } from '../utils/optimize'

// Calls the public OSRM demo server directly — no local server needed.
// Format: /route/v1/driving/lon,lat;lon,lat?overview=full&geometries=geojson
async function fetchPublicRoute(origin, destination, waypoints) {
  const coords = [origin, ...waypoints, destination]
    .map(p => `${p.lon},${p.lat}`)
    .join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
  const { data } = await axios.get(url)
  if (data.code !== 'Ok') throw new Error('OSRM error: ' + data.code)
  const leg = data.routes[0]
  return {
    geometry: leg.geometry,
    summary: {
      distance_km: (leg.distance / 1000).toFixed(1),
      duration_human: `${Math.round(leg.duration / 60)} min`,
    },
  }
}

export default function OptimizeButton({
  cars,
  roster,
  destination,
  onRoutes,
  onAssigned,
  onLoading,
  onError,
  usePublicOSRM,
  mode,
}) {

  async function handleOptimize() {
    if (!destination) return onError('Please set a destination first.')
    if (cars.length === 0) return onError('Please add at least one car.')

    onError(null)
    onLoading(true)
    onRoutes([])

    try {
      const assignedCars = optimizeCarpool(cars, roster, destination, mode)
      onAssigned?.(assignedCars)

      const routePromises = assignedCars.map(async car => {
        const waypoints = car.passengers.map(p => ({ lat: p.lat, lon: p.lon }))

        // pickup:  driver → passengers → destination
        // dropoff: destination → passengers → driver home
        const origin = mode === 'dropoff'
          ? { lat: destination.lat, lon: destination.lon }
          : { lat: car.driver.lat, lon: car.driver.lon }
        const dest = mode === 'dropoff'
          ? { lat: car.driver.lat, lon: car.driver.lon }
          : { lat: destination.lat, lon: destination.lon }

        // Guard: if any coordinate is missing, skip routing for this car
        const allPoints = [origin, dest, ...waypoints]
        if (allPoints.some(p => p.lat == null || p.lon == null || isNaN(p.lat) || isNaN(p.lon))) {
          console.warn(`Skipping route for ${car.driver.name}: missing coordinates`, { origin, dest, waypoints })
          return null
        }

        let route
        if (usePublicOSRM) {
          route = await fetchPublicRoute(origin, dest, waypoints)
        } else {
          const { data } = await axios.post('http://localhost:3000/api/route', {
            origin,
            destination: dest,
            waypoints,
          })
          route = data
        }

        return { car, route }
      })

      const results = (await Promise.all(routePromises)).filter(Boolean)
      onRoutes(results)

    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Something went wrong'
      const status = err.response?.status
      onError(status ? `${msg} (HTTP ${status})` : msg)
    } finally {
      onLoading(false)
    }
  }

  const ready = cars.length > 0 && destination && roster.length > 0

  return (
    <button
      onClick={handleOptimize}
      disabled={!ready}
      style={{
        width: '100%',
        padding: '11px',
        background: ready ? '#059669' : '#d1d5db',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: ready ? 'pointer' : 'not-allowed',
      }}
    >
      Fill &amp; Optimize Routes
    </button>
  )
}