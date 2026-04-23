import { useState } from 'react'
import Papa from "papaparse";

export default function RosterImporter({ onRoster }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLoad() {
    setError(null)
    setLoading(true)

    try {
      const fetchUrl = url.includes('?') ? url + '&t=' + Date.now() : url + '?t=' + Date.now()

      const res = await fetch(fetchUrl)
      const text = await res.text()

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const people = results.data.map(row => ({
            name: row.Name?.trim(),
            email: row.Email?.trim(),
            address: row.Address?.trim(),
            city: row.City?.trim(),
            zipcode: row.Zipcode?.trim(),
            status: row.Status?.trim(),  // "Driver" or "Passenger"
            lat: parseFloat(row.Latitude),
            lon: parseFloat(row.Longitude),
          })).filter(p => p.name && !isNaN(p.lat) && !isNaN(p.lon))

          onRoster(people)
          setLoading(false)
        },
        error: (err) => {
          setError('Failed to parse CSV: ' + err.message)
          setLoading(false)
        }
      })
    } catch (err) {
      setError('Failed to fetch sheet: ' + err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        style={{
          width: '100%',
          padding: '9px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '13px',
          boxSizing: 'border-box',
        }}
        placeholder="Paste Google Sheet CSV URL..."
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <button
        onClick={handleLoad}
        disabled={!url || loading}
        style={{
          padding: '9px',
          background: loading ? '#93c5fd' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Loading...' : 'Load Roster'}
      </button>
      {error && <div style={{ fontSize: '13px', color: '#b91c1c' }}>{error}</div>}
    </div>
  )
}