export default function Loader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100dvh', flexDirection: 'column', gap: 16
    }}>
      <div style={{
        width: 28, height: 28, border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ color: 'var(--subtext)', fontSize: 13, fontWeight: 500, letterSpacing: '0.04em' }}>
        Загрузка...
      </span>
    </div>
  )
}
