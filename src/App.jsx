import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider, useStore } from './store.jsx'
import { login } from './api'
import NavBar from './components/NavBar'
import Settings from './pages/Settings'
import Automations from './pages/Automations'
import Orders from './pages/Orders'
import Loader from './components/Loader'
import { ToastContainer, useToast } from './components/Toast'

function Inner() {
  const { setUser } = useStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { show } = useToast()

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData || ''

    login(initData || 'dev')
      .then(u => {
        setUser(u)
        setLoading(false)
        setTimeout(() => {
          if (u.has_golden_key) {
            show('FunPay подключён ✓', 'success')
          } else {
            show('Добавьте FunPay Golden Key в настройках', 'info')
          }
        }, 200)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      <ToastContainer />
      {loading && <Loader />}
      {error && <ErrorScreen msg={error} />}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 72 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/automations" replace />} />
              <Route path="/automations" element={<Automations />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
          <NavBar />
        </div>
      )}
    </>
  )
}

function ErrorScreen({ msg }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100dvh', gap:12, padding:24 }}>
      <span style={{ fontSize:32 }}>⚠️</span>
      <p style={{ color:'var(--danger)', textAlign:'center', fontWeight:600 }}>Ошибка авторизации</p>
      <p style={{ color:'var(--subtext)', textAlign:'center', fontSize:13 }}>{msg}</p>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Inner />
      </BrowserRouter>
    </StoreProvider>
  )
}
