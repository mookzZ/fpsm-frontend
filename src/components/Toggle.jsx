export default function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22,
        background: value ? 'var(--accent)' : 'var(--border)',
        borderRadius: 11,
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3, left: value ? 21 : 3,
        width: 16, height: 16,
        background: '#fff',
        borderRadius: '50%',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </div>
  )
}
