import { useState } from 'react'

export default function DestinationPicker({ onDestination, destination }) {
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [label, setLabel] = useState('')

  function handleSet() {
    onDestination({
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      label: label || 'Destination',
    })
  }

  const inputStyle = {
    flex: 1,
    padding: '9px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <input
        style={{ ...inputStyle, width: '100%' }}
        placeholder="Label (e.g. Stadium, Office...)"
        value={label}
        onChange={e => setLabel(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <input style={inputStyle} placeholder="Lat" value={lat} onChange={e => setLat(e.target.value)} />
        <input style={inputStyle} placeholder="Lon" value={lon} onChange={e => setLon(e.target.value)} />
      </div>
      <button
        onClick={handleSet}
        disabled={!lat || !lon}
        style={{
          padding: '9px',
          background: destination ? '#059669' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {destination ? `✓ Set: ${destination.label}` : 'Set Destination'}
      </button>
    </div>
  )
}