import { createContext, useContext, useState } from 'react'

const Store = createContext(null)

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null)     // { user_id, telegram_id, username, permission, expires_in, has_golden_key, has_smm_key }
  const [lots, setLots] = useState([])
  const [automations, setAutomations] = useState([])

  return (
    <Store.Provider value={{ user, setUser, lots, setLots, automations, setAutomations }}>
      {children}
    </Store.Provider>
  )
}

export const useStore = () => useContext(Store)
