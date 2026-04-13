export default function Button({ children, onClick, variant = 'primary', loading, disabled, full }) {
  const styles = {
    primary: { background: 'var(--accent)', color: '#fff' },
    secondary: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' },
    danger: { background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles[variant],
        borderRadius: 'var(--radius)',
        padding: '10px 18px',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.03em',
        width: full ? '100%' : undefined,
        opacity: (disabled || loading) ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.1s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        border: styles[variant].border || 'none',
      }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      {loading && (
        <div style={{
          width: 13, height: 13,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      )}
      {children}
    </button>
  )
}
