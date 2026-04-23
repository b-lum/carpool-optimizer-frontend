import { useState, useRef, useEffect } from 'react'

const CAR_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d']

export default function CarBuilder({ roster, cars, setCars }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [capacity, setCapacity] = useState(5)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const usedDriverEmails = new Set(cars.map(c => c.driver.email))
  const availableDrivers = roster.filter(d => !usedDriverEmails.has(d.email))

  const filtered = searchTerm.trim()
    ? availableDrivers.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableDrivers

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function selectDriver(driver) {
    const newCar = {
      id: driver.email,
      driver,
      capacity: parseInt(capacity),
      color: CAR_COLORS[cars.length % CAR_COLORS.length],
      passengers: [],
    }
    setCars(prev => [...prev, newCar])
    setSearchTerm('')
    setDropdownOpen(false)
  }

  function removeCar(id) {
    setCars(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {roster.length === 0 && (
        <div style={{ fontSize: '13px', color: '#9ca3af' }}>Load a roster first.</div>
      )}

      {roster.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              placeholder={availableDrivers.length === 0 ? 'No drivers available' : 'Search driver...'}
              value={searchTerm}
              disabled={availableDrivers.length === 0}
              onChange={e => {
                setSearchTerm(e.target.value)
                setDropdownOpen(true)
              }}
              onFocus={() => setDropdownOpen(true)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px',
                background: availableDrivers.length === 0 ? '#f9fafb' : '#fff',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />

            {dropdownOpen && filtered.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 100,
                  maxHeight: '180px',
                  overflowY: 'auto',
                }}
              >
                {filtered.map(d => (
                  <div
                    key={d.email}
                    onMouseDown={() => selectDriver(d)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#374151',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ opacity: 0.5, fontSize: '11px' }}>{d.status === 'Driver' ? '🚗' : '👤'}</span>
                    {d.name}
                  </div>
                ))}
              </div>
            )}

            {dropdownOpen && searchTerm.trim() && filtered.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  color: '#9ca3af',
                  zIndex: 100,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                No matching drivers
              </div>
            )}
          </div>

          <input
            type="number"
            min={1}
            max={15}
            value={capacity}
            onChange={e => setCapacity(e.target.value)}
            title="Seat capacity"
            style={{
              width: '60px',
              padding: '9px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
        </div>
      )}

      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {cars.map(car => (
          <div key={car.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            background: '#f9fafb',
            borderRadius: '8px',
            borderLeft: `4px solid ${car.color}`,
          }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{car.driver.name}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Capacity: {car.capacity} seats</div>
            </div>
            <button
              onClick={() => removeCar(car.id)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}