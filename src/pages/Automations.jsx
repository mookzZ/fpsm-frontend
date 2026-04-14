import { useEffect, useState } from 'react'
import { useStore } from '../store.jsx'
import { getAutomations, createAutomation, toggleAutomation, deleteAutomation, getLotsFromFunpay, getOrders } from '../api'
import Button from '../components/Button'
import Toggle from '../components/Toggle'
import Input from '../components/Input'
import { useToast } from '../components/Toast'
import Loader from '../components/Loader'

const SERVICE_STATUS_LABEL = {
  pending_input:    'Ожидает ссылку',
  awaiting_confirm: 'Ожидает подтверждение',
  processing:       'В обработке',
  done:             'Выполнен',
  failed:           'Ошибка',
}

const SERVICE_STATUS_COLOR = {
  pending_input:    'var(--warn)',
  awaiting_confirm: 'var(--warn)',
  processing:       'var(--accent)',
  done:             'var(--success)',
  failed:           'var(--danger)',
}

export default function Automations() {
  const { user, automations, setAutomations } = useStore()
  const { show } = useToast()
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    try {
      const auts = await getAutomations(user.user_id)
      setAutomations(auts)
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id, current) => {
    try {
      const updated = await toggleAutomation(user.user_id, id, !current)
      setAutomations(a => a.map(x => x.id === id ? updated : x))
    } catch (e) {
      show(e.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteAutomation(user.user_id, id)
      setAutomations(a => a.filter(x => x.id !== id))
      show('Удалено', 'info')
    } catch (e) {
      show(e.message, 'error')
    }
  }

  if (loading) return <Loader />

  const usedFunpayLotIds = new Set(automations.map(a => a.funpay_lot_id).filter(Boolean))

  return (
    <div className="fade-in" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)' }}>
          Автоматизации · {automations.length}
        </p>
        <Button variant="secondary" onClick={() => setShowModal(true)}>
          + Добавить
        </Button>
      </div>

      {automations.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {automations.map(a => (
            <AutomationCard
              key={a.id}
              data={a}
              userId={user.user_id}
              onToggle={() => handleToggle(a.id, a.is_active)}
              onDelete={() => handleDelete(a.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddModal
          userId={user.user_id}
          usedFunpayLotIds={usedFunpayLotIds}
          onClose={() => setShowModal(false)}
          onCreated={(newA) => {
            setAutomations(a => [...a, newA])
            setShowModal(false)
            show('Автоматизация добавлена', 'success')
          }}
          show={show}
        />
      )}
    </div>
  )
}

function AutomationCard({ data, userId, onToggle, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${data.is_active ? 'var(--border)' : 'var(--surface-2)'}`,
      borderLeft: `3px solid ${data.is_active ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '14px',
      transition: 'border-color 0.2s, opacity 0.2s',
      opacity: data.is_active ? 1 : 0.6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' }}>
            {data.lot_title || 'Без названия'}
          </p>
          {data.lot_subcategory && (
            <p style={{ color: 'var(--subtext)', fontSize: 11, marginTop: 3, fontWeight: 500 }}>
              {data.lot_subcategory}
            </p>
          )}
        </div>
        <Toggle value={data.is_active} onChange={onToggle} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Chip label="SMM ID" value={data.smm_service_id} />
        {data.service_name && <Chip label="Сервис" value={data.service_name} />}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          onClick={() => setShowHistory(true)}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' }}
        >
          История
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ background: 'none', border: 'none', color: 'var(--subtext)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' }}
          >
            Удалить
          </button>
        ) : (
          <>
            <button onClick={onDelete} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' }}>
              Подтвердить
            </button>
            <button onClick={() => setConfirmDelete(false)} style={{ background: 'none', border: 'none', color: 'var(--subtext)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'var(--font)' }}>
              Отмена
            </button>
          </>
        )}
      </div>

      {showHistory && (
        <HistoryModal
          automation={data}
          userId={userId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

function HistoryModal({ automation, userId, onClose }) {
  const { show } = useToast()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    getOrders(userId)
      .then(all => {
        const filtered = all
          .filter(o => o.lot_funpay_id === automation.funpay_lot_id)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setOrders(filtered)
      })
      .catch(e => show(e.message, 'error'))
      .finally(() => setLoading(false))
  }, [])

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
        maxHeight: '85dvh', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16 }}>История заказов</p>
            <p style={{ color: 'var(--subtext)', fontSize: 12, marginTop: 2 }}>{automation.lot_title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--subtext)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>

        {selected ? (
          <OrderDetail order={selected} onBack={() => setSelected(null)} />
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Spinner />
          </div>
        ) : orders.length === 0 ? (
          <p style={{ color: 'var(--subtext)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
            Нет заказов по этой автоматизации
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orders.map(o => (
              <OrderRow key={o.order_id} order={o} onClick={() => setSelected(o)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderRow({ order, onClick }) {
  const svc = order.service
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}
    >
      <div>
        <p style={{ fontWeight: 700, fontSize: 13 }}>#{order.funpay_order_id}</p>
        <p style={{ color: 'var(--subtext)', fontSize: 11, marginTop: 2 }}>
          {new Date(order.created_at).toLocaleDateString('ru-RU')}
          {order.buyer_username && ` · @${order.buyer_username}`}
        </p>
      </div>
      <StatusBadge status={svc?.status} />
    </div>
  )
}

function OrderDetail({ order, onBack }) {
  const svc = order.service
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '0 0 14px 0', fontFamily: 'var(--font)', textAlign: 'left' }}
      >
        ← Назад
      </button>

      <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Заказ #{order.funpay_order_id}</p>

      <InfoBlock>
        <InfoRow label="Статус" value={<StatusBadge status={svc?.status} />} />
        <InfoRow label="Покупатель" value={order.buyer_username ? `@${order.buyer_username}` : '—'} />
        <InfoRow label="Ссылка / ник" value={order.buyer_input || '—'} />
        <InfoRow label="Сумма" value={order.sum_ != null ? `${order.sum_} ₽` : '—'} />
        <InfoRow label="Количество" value={order.quantity ?? '—'} last />
      </InfoBlock>

      {svc && (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)', margin: '14px 0 8px 2px' }}>SMM</p>
          <InfoBlock>
            <InfoRow label="SMM Service ID" value={svc.smm_service_id ?? '—'} />
            <InfoRow label="SMM Order ID" value={svc.smm_order_id ?? '—'} last />
          </InfoBlock>
        </>
      )}

      <p style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 14, textAlign: 'center' }}>
        {new Date(order.created_at).toLocaleString('ru-RU')}
      </p>
    </div>
  )
}

function StatusBadge({ status }) {
  const color = SERVICE_STATUS_COLOR[status] || 'var(--subtext)'
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      color, background: `${color}20`,
      borderRadius: 4, padding: '3px 7px', whiteSpace: 'nowrap',
    }}>
      {SERVICE_STATUS_LABEL[status] || status}
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

function Spinner() {
  return (
    <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
  )
}

function Chip({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', background: 'var(--surface-2)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600 }}>
      <span style={{ color: 'var(--subtext)' }}>{label}:</span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  )
}

function Empty() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--subtext)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <p style={{ color: 'var(--subtext)', fontSize: 13, fontWeight: 500 }}>Нет автоматизаций</p>
      <p style={{ color: 'var(--subtext)', fontSize: 12, opacity: 0.6, textAlign: 'center', maxWidth: 220 }}>
        Добавьте лот и привяжите к нему SMM-сервис
      </p>
    </div>
  )
}

function AddModal({ userId, usedFunpayLotIds, onClose, onCreated, show }) {
  const [lots, setLots] = useState([])
  const [lotsLoading, setLotsLoading] = useState(true)
  const [selectedLot, setSelectedLot] = useState(null)
  const [smmId, setSmmId] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchLots = async () => {
    setLotsLoading(true)
    try {
      const data = await getLotsFromFunpay(userId)
      setLots(data)
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setLotsLoading(false)
    }
  }

  useEffect(() => { fetchLots() }, [])

  const availableLots = lots.filter(l => !usedFunpayLotIds.has(l.funpay_lot_id))

  const handleCreate = async () => {
    if (!selectedLot) { show('Выберите лот', 'error'); return }
    if (!smmId.trim() || isNaN(+smmId)) { show('Укажите корректный SMM Service ID', 'error'); return }
    setCreating(true)
    try {
      const result = await createAutomation(userId, {
        lot: {
          funpay_lot_id: selectedLot.funpay_lot_id,
          title: selectedLot.title,
          price: selectedLot.price,
          subcategory: selectedLot.subcategory,
          public_link: selectedLot.public_link,
        },
        smm_service_id: +smmId,
        service_name: serviceName.trim() || null,
      })
      onCreated(result)
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setCreating(false)
    }
  }

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
        display: 'flex', flexDirection: 'column', gap: 16,
        maxHeight: '85dvh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontWeight: 700, fontSize: 16 }}>Новая автоматизация</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--subtext)', fontSize: 22, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--subtext)' }}>
              Лот
            </label>
            <button
              onClick={fetchLots}
              disabled={lotsLoading}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', opacity: lotsLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span style={{ display: 'inline-block', animation: lotsLoading ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
              {lotsLoading ? 'Загрузка...' : 'Обновить'}
            </button>
          </div>

          {lotsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Spinner />
            </div>
          ) : availableLots.length === 0 ? (
            <p style={{ color: 'var(--subtext)', fontSize: 13, padding: '10px 0' }}>
              Все лоты уже используются или нет доступных.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
              {availableLots.map(lot => (
                <div
                  key={lot.funpay_lot_id}
                  onClick={() => setSelectedLot(lot)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius)',
                    border: `1px solid ${selectedLot?.funpay_lot_id === lot.funpay_lot_id ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedLot?.funpay_lot_id === lot.funpay_lot_id ? 'var(--accent-dim)' : 'var(--surface-2)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{lot.title || 'Без названия'}</p>
                  <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                    {lot.subcategory && <span style={{ color: 'var(--subtext)', fontSize: 11 }}>{lot.subcategory}</span>}
                    {lot.price != null && <span style={{ color: 'var(--subtext)', fontSize: 11 }}>{lot.price} ₽</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Input
          label="SMM Service ID"
          value={smmId}
          onChange={setSmmId}
          placeholder="Например: 1234"
          type="number"
          hint="ID сервиса из каталога smmway.ru"
        />

        <Input
          label="Название сервиса (необязательно)"
          value={serviceName}
          onChange={setServiceName}
          placeholder="Например: Подписчики Instagram"
        />

        {selectedLot && (
          <div style={{
            background: 'rgba(79,114,245,0.1)',
            border: '1px solid var(--accent-dim)',
            borderRadius: 'var(--radius)',
            padding: '10px 12px',
            fontSize: 12,
            color: 'var(--text)',
            lineHeight: 1.6,
          }}>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Важно</p>
            <p>Добавьте в описание лота на FunPay следующую строку:</p>
            <code style={{
              display: 'block', marginTop: 6,
              background: 'var(--surface)',
              borderRadius: 6, padding: '6px 10px',
              fontFamily: 'monospace', fontSize: 13,
              color: 'var(--accent)',
              userSelect: 'all',
            }}>
              id: {selectedLot.funpay_lot_id}
            </code>
            <p style={{ marginTop: 6, color: 'var(--subtext)' }}>
              Без этой строки бот не сможет определить лот по заказу.
            </p>
          </div>
        )}

        <Button onClick={handleCreate} loading={creating} disabled={!selectedLot || !smmId} full>
          Создать автоматизацию
        </Button>
      </div>
    </div>
  )
}
