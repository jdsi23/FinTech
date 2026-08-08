import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../store/authStore'
import { applyColorRamp, DEFAULT_APPEARANCE } from '../../lib/theme'
import { applyHomeScreenBranding } from '../../lib/homeScreen'
import type { AppearancePrefs } from '../../types/firestore'

interface AppearanceContextValue {
  /** Last-persisted prefs (or defaults if the user never saved any). Used
   * by the settings page's Don't Save/Load actions to discard a draft. */
  saved: AppearancePrefs
  /** `preview` when set (live-editing on the Appearance page), else `saved`
   * -- what the rest of the app should actually render/theme with. */
  resolved: AppearancePrefs
  setPreview: (prefs: AppearancePrefs | null) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function AppearanceProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const appName = useAuthStore((s) => s.appMeta?.appName) || 'ForecastFlow'
  const [saved, setSaved] = useState<AppearancePrefs>(DEFAULT_APPEARANCE)
  const [preview, setPreview] = useState<AppearancePrefs | null>(null)

  useEffect(() => {
    return onSnapshot(doc(db, 'users', uid, 'appearance', 'prefs'), (snap) => {
      setSaved(snap.exists() ? (snap.data() as AppearancePrefs) : DEFAULT_APPEARANCE)
    })
  }, [uid])

  const resolved = preview ?? saved

  useEffect(() => {
    applyColorRamp(resolved.primaryColor)
  }, [resolved.primaryColor])

  useEffect(() => {
    applyHomeScreenBranding(resolved.homeScreenName || appName, resolved.homeScreenIconUrl || '/favicon.svg')
  }, [resolved.homeScreenName, resolved.homeScreenIconUrl, appName])

  const value = useMemo<AppearanceContextValue>(
    () => ({ saved, resolved, setPreview }),
    [saved, resolved],
  )

  return (
    <AppearanceContext.Provider value={value}>
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-cover bg-center bg-fixed bg-slate-50 dark:bg-slate-950"
        style={resolved.backgroundImageUrl ? { backgroundImage: `url(${resolved.backgroundImageUrl})` } : undefined}
      />
      {children}
    </AppearanceContext.Provider>
  )
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error('useAppearance must be used within AppearanceProvider')
  return ctx
}
