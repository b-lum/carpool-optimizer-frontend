import { useState } from 'react'

export default function PeoplePool({
  width = 200,
  people,
  selected,
  onCellClick,
  dragHandler,
  usePublicOSRM,
  onToggleOSRM,
  mode,
  onToggleMode,
  absentEmails,
  onToggleAbsent,
  onToggleAllAbsent,
  allPeople,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // allPeople includes absent ones so they show up greyed; people = only unabsent+unassigned
  // We display from allPeople (minus assigned) so absent still appear
  const displayPeople = allPeople.filter(p =>
    !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const drivers = displayPeople.filter(p => p.driverStatus === true)
  const passengers = displayPeople.filter(p => p.driverStatus === false)

  const totalPeople = allPeople.length
  const absentCount = allPeople.filter(p => absentEmails.has(p.email)).length
  const activeCount = totalPeople - absentCount

  const allAbsent = totalPeople > 0 && absentCount === totalPeople

  return (
    <div style={{
      width: width + 'px',
      flexShrink: 0,
      borderRight: '1px solid #e5e7eb',
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>

        {/* Title row with settings gear */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Roster
          </div>
          <button
            onClick={() => setSettingsOpen(o => !o)}
            title="Settings"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px', borderRadius: '4px', lineHeight: 1,
              color: settingsOpen ? '#2563eb' : '#9ca3af',
              fontSize: '14px',
            }}
          >
            ⚙
          </button>
        </div>

        {/* Active / absent counter */}
        {totalPeople > 0 && (
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>{activeCount} active</span>
            {' · '}
            <span style={{ color: '#9ca3af' }}>{absentCount} absent</span>
          </div>
        )}

        {/* Settings panel */}
        {settingsOpen && (
          <div style={{
            marginBottom: '8px',
            padding: '8px 10px',
            background: '#f3f4f6',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Routing
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <div
                onClick={onToggleOSRM}
                style={{
                  width: '32px', height: '18px', borderRadius: '9px', flexShrink: 0,
                  background: usePublicOSRM ? '#2563eb' : '#d1d5db',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: usePublicOSRM ? '16px' : '2px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <span style={{ fontSize: '12px', color: '#374151', lineHeight: 1.3 }}>
                {usePublicOSRM ? 'Public OSRM' : 'Local server'}
              </span>
            </label>
            {usePublicOSRM && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>
                Uses router.project-osrm.org — no local server needed, rate limited.
              </div>
            )}
            <div style={{ marginTop: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Direction
              </div>
              <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {['pickup', 'dropoff'].map(m => (
                  <button
                    key={m}
                    onClick={() => mode !== m && onToggleMode()}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      background: mode === m ? '#2563eb' : '#fff',
                      color: mode === m ? '#fff' : '#6b7280',
                      transition: 'all 0.15s',
                    }}
                  >
                    {m === 'pickup' ? '⬆ Pick Up' : '⬇ Drop Off'}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#9ca3af', lineHeight: 1.4 }}>
                {mode === 'pickup' ? 'Drivers collect passengers → destination' : 'Start at destination → drop passengers home'}
              </div>
            </div>
          </div>
        )}

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '12px',
            boxSizing: 'border-box',
            outline: 'none',
            background: '#fff',
            marginBottom: '6px',
          }}
        />

        {/* Grey all / Restore all buttons */}
        {totalPeople > 0 && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => onToggleAllAbsent(true)}
              disabled={allAbsent}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '5px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: allAbsent ? '#d1d5db' : '#6b7280',
                cursor: allAbsent ? 'default' : 'pointer',
              }}
            >
              − Grey all
            </button>
            <button
              onClick={() => onToggleAllAbsent(false)}
              disabled={absentCount === 0}
              style={{
                flex: 1,
                padding: '4px 0',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '5px',
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: absentCount === 0 ? '#d1d5db' : '#059669',
                cursor: absentCount === 0 ? 'default' : 'pointer',
              }}
            >
              ✓ Restore all
            </button>
          </div>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {drivers.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Drivers
            </div>
            {drivers.map((p, i) => {
              const isAbsent = absentEmails.has(p.email)
              // only pass drag/click if not absent? No — still draggable when absent
              return (
                <PoolPersonCell
                  key={p.email}
                  person={p}
                  isAbsent={isAbsent}
                  isSelected={selected?.personName === p.name && selected?.type === 'pool'}
                  dragProps={dragHandler({ type: 'pool' }, i, p)}
                  onClick={() => onCellClick({ type: 'pool' }, i, p)}
                  onToggleAbsent={() => onToggleAbsent(p)}
                />
              )
            })}
          </div>
        )}

        {passengers.length > 0 && (
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Passengers
            </div>
            {passengers.map((p, i) => {
              const isAbsent = absentEmails.has(p.email)
              return (
                <PoolPersonCell
                  key={p.email}
                  person={p}
                  isAbsent={isAbsent}
                  isSelected={selected?.personName === p.name && selected?.type === 'pool'}
                  dragProps={dragHandler({ type: 'pool' }, drivers.length + i, p)}
                  onClick={() => onCellClick({ type: 'pool' }, drivers.length + i, p)}
                  onToggleAbsent={() => onToggleAbsent(p)}
                />
              )
            })}
          </div>
        )}

        {displayPeople.length === 0 && (
          <div style={{ fontSize: '12px', color: '#d1d5db', textAlign: 'center', marginTop: '20px' }}>
            {allPeople.length === 0 ? 'No roster loaded.' : 'No results'}
          </div>
        )}
      </div>
    </div>
  )
}

function PoolPersonCell({ person, isAbsent, isSelected, dragProps, onClick, onToggleAbsent }) {
  return (
    <div
      draggable
      onClick={onClick}
      {...dragProps}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 24px 6px 8px',
        marginBottom: '2px',
        borderRadius: '6px',
        border: `1px solid ${isSelected ? '#2563eb' : '#e5e7eb'}`,
        background: isAbsent ? '#f3f4f6' : isSelected ? '#eff6ff' : '#fff',
        opacity: isAbsent ? 0.55 : 1,
        cursor: 'grab',
        userSelect: 'none',
        fontSize: '12px',
        fontWeight: 500,
        color: isAbsent ? '#9ca3af' : isSelected ? '#2563eb' : '#374151',
        transition: 'all 0.12s ease',
      }}
    >
      <span style={{ opacity: 0.5, fontSize: '10px', flexShrink: 0 }}>
        {person.driverStatus ? '🚗' : '👤'}
      </span>
      <span style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textDecoration: isAbsent ? 'line-through' : 'none',
      }}>
        {person.name}
      </span>

      {/* Absent toggle button */}
      <button
        onClick={e => { e.stopPropagation(); onToggleAbsent() }}
        title={isAbsent ? 'Mark as attending' : 'Mark as absent'}
        style={{
          position: 'absolute',
          top: '50%',
          right: '4px',
          transform: 'translateY(-50%)',
          width: '15px',
          height: '15px',
          borderRadius: '50%',
          border: `1px solid ${isAbsent ? '#d1d5db' : '#e5e7eb'}`,
          background: isAbsent ? '#e5e7eb' : '#fff',
          color: isAbsent ? '#6b7280' : '#d1d5db',
          fontSize: '12px',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          fontWeight: 700,
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = isAbsent ? '#9ca3af' : '#f87171'
          e.currentTarget.style.color = isAbsent ? '#374151' : '#ef4444'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = isAbsent ? '#d1d5db' : '#e5e7eb'
          e.currentTarget.style.color = isAbsent ? '#6b7280' : '#d1d5db'
        }}
      >
        {isAbsent ? '+' : '−'}
      </button>
    </div>
  )
}