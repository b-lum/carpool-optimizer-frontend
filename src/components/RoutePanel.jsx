export default function RoutePanel({ routes }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {routes.map(({ car, route }) => (
        <div key={car.id} style={{
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          borderLeft: `4px solid ${car.color}`,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{car.driver.name}'s car</div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {route.summary.duration_human} · {route.summary.distance_km} km
            </div>
          </div>
          <div style={{ padding: '8px 12px' }}>
            {car.passengers.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>No passengers assigned</div>
            ) : (
              car.passengers.map((p, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#374151', padding: '3px 0' }}>
                  {i + 1}. {p.name}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}