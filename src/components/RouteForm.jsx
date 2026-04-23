import { useState } from 'react'
import axios from 'axios'

export default function RouteForm({ onRoute, onLoading, onError }) {
  const [originLat, setOriginLat] = useState('')
  const [originLon, setOriginLon] = useState('')
  const [destLat, setDestLat] = useState('')
  const [destLon, setDestLon] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    onError(null)
    onRoute(null)
    onLoading(true)

    try {
      const { data } = await axios.post('http://localhost:3000/api/route', {
        origin: { lat: parseFloat(originLat), lon: parseFloat(originLon) },
        destination: { lat: parseFloat(destLat), lon: parseFloat(destLon) },
      })
      onRoute(data)
    } catch (err) {
      onError(err.response?.data?.error || 'Something went wrong')
    } finally {
      onLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
    marginBottom: '6px',
  }

  const rowStyle = {
    display: 'flex',
    gap: '8px',
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      <div>
        <label style={labelStyle}>Origin</label>
        <div style={rowStyle}>
          <input style={inputStyle} placeholder="Lat" value={originLat} onChange={e => setOriginLat(e.target.value)} required />
          <input style={inputStyle} placeholder="Lon" value={originLon} onChange={e => setOriginLon(e.target.value)} required />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Destination</label>
        <div style={rowStyle}>
          <input style={inputStyle} placeholder="Lat" value={destLat} onChange={e => setDestLat(e.target.value)} required />
          <input style={inputStyle} placeholder="Lon" value={destLon} onChange={e => setDestLon(e.target.value)} required />
        </div>
      </div>

      <button
        type="submit"
        style={{
          padding: '10px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Get Route
      </button>
    </form>
  )
}