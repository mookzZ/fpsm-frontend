const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function headers(userId) {
  const h = { 'Content-Type': 'application/json' }
  if (userId) h['X-User-Id'] = userId
  return h
}

async function req(method, path, body, userId) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(userId),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Ошибка запроса')
  }
  return res.json()
}

// Auth
export const login = (initData) =>
  req('POST', '/api/auth/login', { init_data: initData })

// Lots — только с FunPay, без сохранения
export const saveKeys = (userId, golden_key, smm_key) =>
  req('POST', '/api/lots/keys', { golden_key, smm_key }, userId)

export const getLotsFromFunpay = (userId) =>
  req('GET', '/api/lots/from-funpay', null, userId)

// Automations
export const getAutomations = (userId) =>
  req('GET', '/api/automations/', null, userId)

export const createAutomation = (userId, data) =>
  req('POST', '/api/automations/', data, userId)

export const toggleAutomation = (userId, id, is_active) =>
  req('PATCH', `/api/automations/${id}/toggle`, { is_active }, userId)

export const deleteAutomation = (userId, id) =>
  req('DELETE', `/api/automations/${id}`, null, userId)

// Orders (активные)
export const getOrders = (userId) =>
  req('GET', '/api/orders/', null, userId)

// History — те же данные, фильтрация на фронте
export const getAllOrders = (userId) =>
  req('GET', '/api/orders/', null, userId)

// FunPay order URL helper
export const funpayOrderUrl = (funpay_order_id) =>
  `https://funpay.com/orders/${funpay_order_id}/`
