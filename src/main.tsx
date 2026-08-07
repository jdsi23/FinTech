import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Kept in sync with the VITE_FIREBASE_* keys read in src/lib/firebase.ts.
const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const

const missing = REQUIRED_ENV_VARS.filter((key) => !import.meta.env[key])
const root = createRoot(document.getElementById('root')!)

if (missing.length > 0) {
  root.render(
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 560, margin: '80px auto', padding: '0 24px' }}>
      <h1>Firebase configuration missing</h1>
      <p>
        Copy <code>.env.example</code> to <code>.env.local</code> and fill in your Firebase project's
        config values.
      </p>
      <p>
        Missing: <code>{missing.join(', ')}</code>
      </p>
      <p>See README.md for the full setup walkthrough.</p>
    </div>,
  )
} else {
  import('./App').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })
}
