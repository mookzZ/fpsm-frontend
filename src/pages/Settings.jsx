import { useState } from 'react'
import { useStore } from '../store.jsx'
import { saveKeys } from '../api'
import Input from '../components/Input'
import Button from '../components/Button'
import { useToast } from '../components/Toast'

export default function Settings() {
  const { user, setUser } = useStore()
  const { show } = useToast()

  const [goldenKey, setGoldenKey] = useState('')
  const [smmKey, setSmmKey] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!goldenKey.trim() || !smmKey.trim()) {
      show('Заполните оба поля', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await saveKeys(user.user_id, goldenKey.trim(), smmKey.trim())
      
      setUser(u => ({ ...u, has_golden_key: true, has_smm_key: true }))
      show(`Сохранено. Аккаунт: ${res.username}`, 'success')
      setGoldenKey('')
      setSmmKey('')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const permColor = {
    free: 'var(--subtext)',
    basic: 'var(--accent)',
    pro: 'var(--success)',
    admin: 'var(--warn)',
  }[user?.permission] || 'var(--subtext)'

  return (
    <div className="fade-in" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Account info */}
        <section>
          <SectionLabel>Аккаунт</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <Row label="Telegram" value={user?.username ? `@${user.username}` : `ID ${user?.telegram_id}`} />
            <Row label="Тариф" value={
              <span style={{ color: permColor, fontWeight: 700, textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.08em' }}>
                {user?.permission || '—'}
              </span>
            } />
            <Row label="Действует до" value={
              user?.expires_in
                ? new Date(user.expires_in).toLocaleDateString('ru-RU')
                : <span style={{ color: 'var(--subtext)' }}>—</span>
            } last />
          </div>
        </section>

        {/* Status */}
        <section>
          <SectionLabel>Статус ключей</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <Row label="FunPay Golden Key" value={<StatusDot active={user?.has_golden_key} />} />
            <Row label="SMM Key" value={<StatusDot active={user?.has_smm_key} />} last />
          </div>
        </section>

        {/* Keys form */}
        <section>
          <SectionLabel>Обновить ключи</SectionLabel>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="FunPay Golden Key"
              value={goldenKey}
              onChange={setGoldenKey}
              placeholder="Вставьте golden_key из cookies FunPay"
              type="password"
              hint="Можно найти в cookies после входа на funpay.com"
            />
            <Input
              label="SMMWay API Key"
              value={smmKey}
              onChange={setSmmKey}
              placeholder="Вставьте API ключ smmway.ru"
              type="password"
              hint="Настройки → API на сайте smmway.ru"
            />
            <Button onClick={handleSave} loading={loading} full>
              Сохранить и синхронизировать
            </Button>
          </div>
        </section>

    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)', marginBottom: 8, paddingLeft: 2 }}>
      {children}
    </p>
  )
}

function Row({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <span style={{ color: 'var(--subtext)', fontWeight: 500, fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 13 }}>{value}</span>
    </div>
  )
}

function StatusDot({ active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: active ? 'var(--success)' : 'var(--danger)',
        boxShadow: active ? '0 0 6px var(--success)' : 'none',
      }} />
      <span style={{ fontWeight: 600, fontSize: 12, color: active ? 'var(--success)' : 'var(--danger)' }}>
        {active ? 'Активен' : 'Не настроен'}
      </span>
    </div>
  )
}
