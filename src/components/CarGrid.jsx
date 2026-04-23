// CarGrid.jsx
// Renders a Car instance as a single-column grid (driver + passengers)

import { useState } from 'react'

const CELL_W = 100
const CELL_H = 40
const LABEL_W = 36

export default function CarGrid({ car, selected, dragHandler, onCellClick, onRemove, routeSummary }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: '20px' }}>
      
      {/* Title — driver name + color strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '4px',
        fontWeight: 'bold', fontSize: '14px', color: '#1a1a1a',
      }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: car.color, flexShrink: 0 }} />
        {car.driver.name}
        <span style={{ fontSize: '11px', fontWeight: 400, color: '#9ca3af' }}>
          · {car.getAvailableSeats()} open
        </span>
      </div>

      {/* Route summary */}
      {routeSummary ? (
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span>🕐 {routeSummary.duration_human}</span>
          <span style={{ color: '#d1d5db' }}>·</span>
          <span>📍 {(parseFloat(routeSummary.distance_km) * 0.621371).toFixed(1)} mi</span>
        </div>
      ) : (
        <div style={{ fontSize: '11px', color: '#d1d5db', marginBottom: '6px' }}>no route yet</div>
      )}

      {/* Seats */}
      {[...car.seats.entries()].map(([idx, person]) => {
        const isDriver = idx === 0
        const badge = isDriver ? 'DRV' : `S${idx}`
        const isSelected = selected?.type === 'seat' && selected?.carId === car.id && selected?.index === idx

        return (
          <SeatCell
            key={idx}
            person={person}
            badge={badge}
            index={idx}
            carId={car.id}
            isDriver={isDriver}
            isSelected={isSelected}
            selected={selected}
            dragHandler={dragHandler}
            onCellClick={onCellClick}
            onRemove={onRemove}
          />
        )
      })}
    </div>
  )
}

// ── Seat cell ─────────────────────────────────────────────────────────────
function SeatCell({ person, badge, index, carId, isDriver, isSelected, selected, dragHandler, onCellClick, onRemove }) {
  const [hovered, setHovered] = useState(false)
  const meta = { type: 'seat', carId, index }
  const dProps = dragHandler ? dragHandler(meta, index, person) : {}

  let bg = '#f6f8f9'
  if (isSelected) bg = 'rgba(76, 175, 80, 0.15)'
  else if (hovered && selected) bg = '#ffcc80'

  let borderColor = '#080a0b'
  if (isSelected) borderColor = '#4caf50'

  return (
    <div
      draggable={!!person && !isDriver}
      onClick={() => onCellClick?.(meta, index, person)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...dProps}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: CELL_W,
        height: CELL_H,
        border: `1px solid ${borderColor}`,
        background: bg,
        outline: isSelected ? '2px solid #4caf50' : 'none',
        cursor: person ? 'pointer' : selected ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'background-color 0.15s',
        flexShrink: 0,
      }}
    >
      {badge && <Badge text={badge} />}

      {/* Delete button for non-driver seats */}
      {person && !isDriver && onRemove && (
        <div
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: '#f44336',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          ×
        </div>
      )}

      <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#1a1a1a' }}>
        {person?.name ?? ''}
      </span>
    </div>
  )
}

// ── Small badge ───────────────────────────────────────────────────────────
function Badge({ text }) {
  return (
    <div style={{
      position: 'absolute',
      top: 3,
      left: 5,
      fontSize: '9px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      opacity: 0.5,
      pointerEvents: 'none',
    }}>
      {text}
    </div>
  )
}