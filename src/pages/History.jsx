import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { getAllOrders, getAutomations, funpayOrderUrl } from '../api'
import { useToast } from '../components/Toast'
import Loader from '../components/Loader'

const STATUS_LABEL = {
  pending_input:      'Ожидает ссылку',
  awaiting_confirm:   'Ожидает подтверждение',
  processing:         'В обработке',
  done:               'Выполнен',
  failed:             'Отменен',
  needs_attention:    'Требует внимания',
  operator_requested: 'Оператор',
}

const STATUS_COLOR = {
  pending_input:      'var(--warn)',
  awaiting_confirm:   'var(--warn)',
  processing:         'var(--accent)',
  done:               'var(--success)',
  failed:             'var(--danger)',
  needs_attention:    '#f5c842',
  operator_requested: '#f5c842',
}

export default function History() {
  const { user } = useStore()
  const { show } = useToast()
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState([])   // [{ funpay_lot_id, lot_title, orders }]
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getAllOrders(user.user_id), getAutomations(user.user_id)])
      .then(([allOrders, auts]) => {
        const titleMap = {}
        auts.forEach(a => {
          if (a.funpay_lot_id) titleMap[a.funpay_lot_id] = a.lot_title || a.funpay_lot_id
        })

        const map = {}
        allOrders.forEach(o => {
          const key = o.lot_funpay_id || 'unknown'
          if (!map[key]) map[key] = []
          map[key].push(o)
        })

        const result = Object.entries(map)
          .map(([lotId, orders]) => ({
            funpay_lot_id: lotId,
            lot_title: titleMap[lotId] || `Лот ${lotId}`,
            orders: orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
          }))
          .sort((a, b) => new Date(b.orders[0].created_at) - new Date(a.orders[0].created_at))

        setGroups(result)
      })
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  if (selected) {
    return (
      <OrderDetailPage
        order={selected}
        onBack={() => setSelected(null)}
      />
    )
  }

  const q = search.trim().toLowerCase()

  return (
    <div className="fade-in" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)' }}>
        История заказов
      </p>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Поиск по ID или покупателю..."
        style={{
          width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 12px', color: 'var(--text)',
          fontSize: 13, fontFamily: 'var(--font)', boxSizing: 'border-box', outline: 'none',
        }}
      />

      {groups.length === 0 ? (
        <Empty />
      ) : (
        groups.map(group => {
          const filteredOrders = q
            ? group.orders.filter(o =>
                o.funpay_order_id.toLowerCase().includes(q) ||
                (o.buyer_username || '').toLowerCase().includes(q)
              )
            : group.orders
          if (filteredOrders.length === 0) return null
          return (
            <LotGroup
              key={group.funpay_lot_id}
              group={{ ...group, orders: filteredOrders }}
              onSelectOrder={setSelected}
            />
          )
        })
      )}
    </div>
  )
}

function LotGroup({ group, onSelectOrder }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 0 10px 0', cursor: 'pointer', fontFamily: 'var(--font)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {group.lot_title}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--subtext)',
            background: 'var(--surface-2)', borderRadius: 10,
            padding: '2px 7px',
          }}>
            {group.orders.length}
          </span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="var(--subtext)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {group.orders.map(o => (
            <OrderRow
              key={o.order_id}
              order={o}
              onClick={() => onSelectOrder(o)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderRow({ order, onClick }) {
  const svc = order.service
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${STATUS_COLOR[svc?.status] || 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        onClick={onClick}
        style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>#{order.funpay_order_id}</span>
          <FunPayLink orderId={order.funpay_order_id} />
        </div>
        <p style={{ color: 'var(--subtext)', fontSize: 11 }}>
          {new Date(order.created_at).toLocaleDateString('ru-RU')}
          {order.buyer_username && ` · @${order.buyer_username}`}
          {order.sum_ != null && ` · ${order.sum_} ₽`}
        </p>
      </div>
      <StatusBadge status={svc?.status} />
    </div>
  )
}

function OrderDetailPage({ order, onBack }) {
  const svc = order.service
  return (
    <div className="fade-in" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', color: 'var(--accent)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          padding: '0 0 16px 0', fontFamily: 'var(--font)', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        ← История
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <p style={{ fontWeight: 700, fontSize: 17 }}>Заказ #{order.funpay_order_id}</p>
        <FunPayLink orderId={order.funpay_order_id} />
      </div>

      <InfoBlock>
        <InfoRow label="Статус" value={<StatusBadge status={svc?.status} />} />
        <InfoRow label="Покупатель" value={order.buyer_username ? `@${order.buyer_username}` : '—'} />
        <InfoRow label="Ссылка / ник" value={order.buyer_input || '—'} />
        <InfoRow label="Сумма" value={order.sum_ != null ? `${order.sum_} ₽` : '—'} />
        <InfoRow label="Количество" value={order.quantity ?? '—'} last />
      </InfoBlock>

      {svc && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)', margin: '16px 0 8px 2px' }}>
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
      borderRadius: 4, padding: '3px 7px', whiteSpace: 'nowrap', flexShrink: 0,
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
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      </div>
      <p style={{ color: 'var(--subtext)', fontSize: 13, fontWeight: 500 }}>История пуста</p>
      <p style={{ color: 'var(--subtext)', fontSize: 12, opacity: 0.6, textAlign: 'center', maxWidth: 220 }}>
        Выполненные заказы будут отображаться здесь
      </p>
    </div>
  )
}
