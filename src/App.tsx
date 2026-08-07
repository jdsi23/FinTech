import { useEffect } from 'react'
import { AppRoutes } from './routes/AppRoutes'
import { initAuthListeners } from './store/authStore'

function App() {
  useEffect(() => {
    initAuthListeners()
  }, [])

  return <AppRoutes />
}

export default App
