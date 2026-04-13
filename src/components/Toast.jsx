import { useState, useCallback, useRef } from 'react'

let _show = null

export function useToast() {
  return { show: (msg, type = 'info') => _show?.(msg, type) }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  _show = useCallback((msg, type = 'info') => {
    const id = ++counter.current
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  const colors = { info: 'var(--accent)', success: 'var(--success)', error: 'var(--danger)' }

  return (
    <div style={{ position: 'fixed', top: 16, left: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} className="fade-in" style={{
          background: 'var(--surface-2)',
          border: `1px solid ${colors[t.type] || 'var(--border)'}`,
          borderLeft: `3px solid ${colors[t.type] || 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text)',
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
