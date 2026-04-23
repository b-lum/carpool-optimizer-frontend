import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function MapView({ routes, destination }) {
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-119, 36.5],
      zoom: 6,
    })
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    return () => map.current.remove()
  }, [])

  useEffect(() => {
    if (!map.current || routes.length === 0) return

    const draw = () => {
      // Remove old layers
      routes.forEach((_, i) => {
        if (map.current.getSource(`route-${i}`)) {
          map.current.removeLayer(`route-line-${i}`)
          map.current.removeSource(`route-${i}`)
        }
      })

      // Also clean up any extras from previous runs
      for (let i = routes.length; i < 10; i++) {
        if (map.current.getSource(`route-${i}`)) {
          map.current.removeLayer(`route-line-${i}`)
          map.current.removeSource(`route-${i}`)
        }
      }

      const allCoords = []

      routes.forEach(({ car, route }, i) => {
        const geojson = route.geometry
        allCoords.push(...geojson.coordinates)

        map.current.addSource(`route-${i}`, {
          type: 'geojson',
          data: { type: 'Feature', geometry: geojson }
        })

        map.current.addLayer({
          id: `route-line-${i}`,
          type: 'line',
          source: `route-${i}`,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': car.color, 'line-width': 4, 'line-opacity': 0.85 }
        })

        // Add marker for each passenger pickup
        car.passengers.forEach(p => {
          new maplibregl.Marker({ color: car.color })
            .setLngLat([p.lon, p.lat])
            .setPopup(new maplibregl.Popup().setText(p.name))
            .addTo(map.current)
        })
      })

      // Destination marker
      if (destination) {
        new maplibregl.Marker({ color: '#111827' })
          .setLngLat([destination.lon, destination.lat])
          .setPopup(new maplibregl.Popup().setText(destination.label))
          .addTo(map.current)
      }

      // Fit to all routes
      if (allCoords.length > 0) {
        const bounds = allCoords.reduce(
          (b, c) => b.extend(c),
          new maplibregl.LngLatBounds(allCoords[0], allCoords[0])
        )
        map.current.fitBounds(bounds, { padding: 60 })
      }
    }

    if (map.current.isStyleLoaded()) {
      draw()
    } else {
      map.current.once('load', draw)
    }

  }, [routes, destination])

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
}