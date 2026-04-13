export default function Input({ label, value, onChange, placeholder, type = 'text', hint, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)' }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'var(--surface-2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '10px 12px',
          color: 'var(--text)',
          fontSize: 13,
          fontWeight: 500,
          width: '100%',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e => e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)'}
      />
      {(hint || error) && (
        <span style={{ fontSize: 11, color: error ? 'var(--danger)' : 'var(--subtext)', fontWeight: 500 }}>
          {error || hint}
        </span>
      )}
    </div>
  )
}
