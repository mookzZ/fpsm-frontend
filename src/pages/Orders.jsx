import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { getOrders, getAutomations, funpayOrderUrl } from '../api'
import { useToast } from '../components/Toast'
import Loader from '../components/Loader'

const ACTIVE_STATUSES = new Set(['pending_input', 'awaiting_confirm', 'processing'])

const STATUS_LABEL = {
  pending_input:    'Ожидает ссылку',
  awaiting_confirm: 'Ожидает подтверждение',
  processing:       'В обработке',
  done:             'Выполнен',
  failed:           'Ошибка',
}

const STATUS_COLOR = {
  pending_input:    'var(--warn)',
  awaiting_confirm: 'var(--warn)',
  processing:       'var(--accent)',
  done:             'var(--success)',
  failed:           'var(--danger)',
}

export default function Orders() {
  const { user } = useStore()
  const { show } = useToast()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [automations, setAutomations] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    Promise.all([getOrders(user.user_id), getAutomations(user.user_id)])
      .then(([ords, auts]) => {
        setOrders(
          ords
            .filter(o => o.service && ACTIVE_STATUSES.has(o.service.status))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        )
        setAutomations(auts)
      })
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const findAutomation = (lotFunpayId) =>
    automations.find(a => a.funpay_lot_id === lotFunpayId) || null

  if (loading) return <Loader />

  return (
    <div className="fade-in" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)' }}>
        Текущие заказы · {orders.length}
      </p>

      {orders.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(o => (
            <OrderCard
              key={o.order_id}
              order={o}
              automation={findAutomation(o.lot_funpay_id)}
              onClick={() => setSelected(o)}
            />
          ))}
        </div>
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          automation={findAutomation(selected.lot_funpay_id)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function OrderCard({ order, automation, onClick }) {
  const svc = order.service
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${STATUS_COLOR[svc?.status] || 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '14px',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>#{order.funpay_order_id}</span>
          <FunPayLink orderId={order.funpay_order_id} />
        </div>
        <StatusBadge status={svc?.status} />
      </div>
      {order.buyer_username && (
        <p style={{ fontSize: 12, color: 'var(--subtext)', marginBottom: 3 }}>@{order.buyer_username}</p>
      )}
      {automation && (
        <p style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>
          {automation.lot_title || 'Автоматизация'}
        </p>
      )}
      <p style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 6, opacity: 0.6 }}>
        {new Date(order.created_at).toLocaleString('ru-RU')}
      </p>
    </div>
  )
}

function OrderDetailModal({ order, automation, onClose }) {
  const svc = order.service
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="fade-in" style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        borderRadius: '16px 16px 0 0',
        padding: '20px 16px 36px',
        display: 'flex', flexDirection: 'column', gap: 0,
        maxHeight: '85dvh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 16 }}>Заказ #{order.funpay_order_id}</p>
            <FunPayLink orderId={order.funpay_order_id} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--subtext)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>

        <InfoBlock>
          <InfoRow label="Статус" value={<StatusBadge status={svc?.status} />} />
          <InfoRow label="Покупатель" value={order.buyer_username ? `@${order.buyer_username}` : '—'} />
          <InfoRow label="Ссылка / ник" value={order.buyer_input || '—'} />
          <InfoRow label="Сумма" value={order.sum_ != null ? `${order.sum_} ₽` : '—'} />
          <InfoRow label="Количество" value={order.quantity ?? '—'} last />
        </InfoBlock>

        {automation && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)', margin: '14px 0 8px 2px' }}>
              Автоматизация
            </p>
            <InfoBlock>
              <InfoRow label="Лот" value={automation.lot_title || '—'} />
              <InfoRow label="Категория" value={automation.lot_subcategory || '—'} last />
            </InfoBlock>
          </>
        )}

        {svc && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)', margin: '14px 0 8px 2px' }}>
              SMM
            </p>
            <InfoBlock>
              <InfoRow label="SMM Service ID" value={svc.smm_service_id ?? '—'} />
              <InfoRow label="SMM Order ID" value={svc.smm_order_id ?? '—'} last />
            </InfoBlock>
          </>
        )}

        <p style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 16, textAlign: 'center' }}>
          {new Date(order.created_at).toLocaleString('ru-RU')}
        </p>
      </div>
    </div>
  )
}

function FunPayLink({ orderId }) {
  return (
    <a
      href={funpayOrderUrl(orderId)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        color: 'var(--accent)', fontSize: 11, fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      FunPay
    </a>
  )
}

function StatusBadge({ status }) {
  const color = STATUS_COLOR[status] || 'var(--subtext)'
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      color, background: `${color}20`,
      borderRadius: 4, padding: '3px 7px', whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function InfoBlock({ children }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function InfoRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 14px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      gap: 12,
    }}>
      <span style={{ color: 'var(--subtext)', fontWeight: 500, fontSize: 12, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

function Empty() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--subtext)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="12" y2="16" />
        </svg>
      </div>
      <p style={{ color: 'var(--subtext)', fontSize: 13, fontWeight: 500 }}>Нет активных заказов</p>
      <p style={{ color: 'var(--subtext)', fontSize: 12, opacity: 0.6, textAlign: 'center', maxWidth: 220 }}>
        Заказы в обработке появятся здесь
      </p>
    </div>
  )
}
