export default function RosterPanel({ roster, cars, absentEmails, onToggleAbsent, onToggleAllAbsent }) {
  const assignedNames = cars.flatMap(c => [
    c.driver.name,
    ...c.passengers.map(p => p.name)
  ])

  const drivers = roster.filter(p => p.status === 'Driver')
  const passengers = roster.filter(p => p.status === 'Passenger')

  const allAbsent = roster.length > 0 && roster.every(p => absentEmails.has(p.email))
  const someAbsent = roster.some(p => absentEmails.has(p.email))

  return (
    <div style={{
      width: '220px',
      borderLeft: '1px solid #e5e7eb',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Roster</h2>
          {roster.length > 0 && (
            <button
              onClick={() => onToggleAllAbsent(!allAbsent)}
              title={allAbsent ? 'Restore everyone' : 'Grey out everyone'}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                background: allAbsent ? '#f3f4f6' : '#fff',
                color: allAbsent ? '#9ca3af' : '#6b7280',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {allAbsent ? '✓ Restore all' : '− Grey all'}
            </button>
          )}
        </div>
        {roster.length > 0 && (
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            {roster.length - absentEmails.size} attending · {absentEmails.size} absent
          </div>
        )}
      </div>

      {roster.length === 0 && (
        <div style={{ padding: '16px', fontSize: '13px', color: '#9ca3af' }}>
          No roster loaded yet.
        </div>
      )}

      {drivers.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Drivers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {drivers.map(p => (
              <PersonRow
                key={p.name}
                person={p}
                assigned={assignedNames.includes(p.name)}
                color={getCarColor(p.name, cars)}
                absent={absentEmails.has(p.email)}
                onToggle={() => onToggleAbsent(p)}
              />
            ))}
          </div>
        </div>
      )}

      {passengers.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: drivers.length > 0 ? '1px solid #f3f4f6' : 'none' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Passengers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {passengers.map(p => (
              <PersonRow
                key={p.name}
                person={p}
                assigned={assignedNames.includes(p.name)}
                color={getCarColor(p.name, cars)}
                absent={absentEmails.has(p.email)}
                onToggle={() => onToggleAbsent(p)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PersonRow({ person, assigned, color, absent, onToggle }) {
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      paddingRight: '24px',
      borderRadius: '6px',
      background: absent ? '#f9fafb' : assigned ? '#f0f9ff' : 'transparent',
      opacity: absent ? 0.5 : 1,
      transition: 'opacity 0.15s, background 0.15s',
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: absent ? '#d1d5db' : (assigned && color ? color : '#e5e7eb'),
        flexShrink: 0,
      }} />
      <span style={{
        fontSize: '13px',
        color: absent ? '#9ca3af' : '#374151',
        textDecoration: absent ? 'line-through' : 'none',
        transition: 'color 0.15s',
      }}>
        {person.name}
      </span>

      {/* Toggle absent button */}
      <button
        onClick={onToggle}
        title={absent ? 'Mark as attending' : 'Mark as absent'}
        style={{
          position: 'absolute',
          top: '50%',
          right: '4px',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: `1px solid ${absent ? '#d1d5db' : '#e5e7eb'}`,
          background: absent ? '#e5e7eb' : '#fff',
          color: absent ? '#6b7280' : '#d1d5db',
          fontSize: '13px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          fontWeight: 700,
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = absent ? '#9ca3af' : '#f87171'
          e.currentTarget.style.color = absent ? '#374151' : '#ef4444'
          e.currentTarget.style.background = absent ? '#d1d5db' : '#fff'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = absent ? '#d1d5db' : '#e5e7eb'
          e.currentTarget.style.color = absent ? '#6b7280' : '#d1d5db'
          e.currentTarget.style.background = absent ? '#e5e7eb' : '#fff'
        }}
      >
        {absent ? '+' : '−'}
      </button>
    </div>
  )
}

function getCarColor(name, cars) {
  for (const car of cars) {
    if (car.driver.name === name) return car.color
    if (car.passengers.some(p => p.name === name)) return car.color
  }
  return null
}