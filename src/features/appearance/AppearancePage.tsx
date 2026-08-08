import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { ErrorBanner, FormField, PrimaryButton, SecondaryButton } from '../../components/AuthLayout'
import { useAppearance } from './AppearanceProvider'
import { saveAppearance } from './actions'
import { DEFAULT_APPEARANCE, PRESETS } from '../../lib/theme'
import type { AppearancePrefs, LayoutMode } from '../../types/firestore'

function applyLayoutMode(mode: LayoutMode, current: AppearancePrefs): AppearancePrefs {
  if (mode === 'custom') return { ...current, layoutMode: 'custom' }
  return { ...current, layoutMode: mode, showBranding: mode !== 'simple', compactNav: mode === 'simple' }
}

export function AppearancePage() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid)
  const { saved, resolved, setPreview } = useAppearance()

  // Seeded from `resolved`, not `saved` -- if you already have an unsaved
  // preview running (from an earlier visit to this page, still applied
  // while you browsed elsewhere), coming back here should show that
  // in-progress draft, not silently jump back to your last saved settings.
  const [draft, setDraft] = useState<AppearancePrefs>(resolved)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loadedOnce) {
      setDraft(resolved)
      setLoadedOnce(true)
    }
  }, [resolved, loadedOnce])

  // Live-preview the draft app-wide -- and it's meant to keep previewing
  // even after navigating to other pages, so you can see how a color
  // actually looks throughout the app before deciding to Save. It only
  // reverts on an explicit Don't Save/Load (back to your last saved
  // settings) or Save (which makes the draft the new saved state).
  useEffect(() => {
    setPreview(draft)
  }, [draft, setPreview])

  if (!uid) return null

  function selectPreset(preset: (typeof PRESETS)[number]) {
    const isCustom = preset.layoutMode === 'custom'
    setDraft((prev) => ({
      ...applyLayoutMode(preset.layoutMode, prev),
      presetId: preset.id,
      primaryColor: isCustom ? prev.primaryColor : preset.primaryColor,
      backgroundColor: isCustom ? prev.backgroundColor : preset.backgroundColor,
      headerColor: isCustom ? prev.headerColor : preset.headerColor,
    }))
    setMessage(null)
    setError(null)
  }

  async function handleSave() {
    if (!uid) return
    setBusy(true)
    setError(null)
    try {
      await saveAppearance(uid, draft)
      setMessage('Saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your appearance settings.')
    } finally {
      setBusy(false)
    }
  }

  function handleDiscard() {
    setDraft(saved)
    setMessage(null)
    setError(null)
  }

  function handleResetDraft() {
    setDraft(DEFAULT_APPEARANCE)
    setMessage("Reset to default -- click Save to keep it.")
    setError(null)
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Appearance</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Personal to your account -- changes here only affect how the app looks for you.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Presets</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`rounded-lg border p-3 text-left transition ${
                draft.presetId === preset.id
                  ? 'border-indigo-500 ring-1 ring-indigo-500'
                  : 'border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-800'
              }`}
            >
              <span
                className="mb-2 block h-5 w-5 rounded-full"
                style={{ backgroundColor: preset.primaryColor }}
                aria-hidden
              />
              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{preset.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{preset.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Custom color</h2>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="color"
            value={draft.primaryColor}
            onChange={(e) => setDraft((prev) => ({ ...prev, primaryColor: e.target.value }))}
            className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 dark:border-slate-700"
          />
          <div className="w-40">
            <FormField
              label="Hex"
              type="text"
              value={draft.primaryColor}
              onChange={(e) => setDraft((prev) => ({ ...prev, primaryColor: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Background</h2>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="color"
            value={draft.backgroundColor ?? '#f8fafc'}
            onChange={(e) => setDraft((prev) => ({ ...prev, backgroundColor: e.target.value }))}
            className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 dark:border-slate-700"
          />
          <div className="w-40">
            <FormField
              label="Background color hex"
              type="text"
              value={draft.backgroundColor ?? ''}
              placeholder="Default (light/dark)"
              onChange={(e) => setDraft((prev) => ({ ...prev, backgroundColor: e.target.value || undefined }))}
            />
          </div>
          <div className="mb-3 w-24">
            <SecondaryButton
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, backgroundColor: undefined }))}
            >
              Clear
            </SecondaryButton>
          </div>
        </div>
        <div className="mt-3 flex items-end gap-3">
          <div className="flex-1">
            <FormField
              label="Background image URL"
              type="text"
              placeholder="https://..."
              value={draft.backgroundImageUrl ?? ''}
              onChange={(e) => setDraft((prev) => ({ ...prev, backgroundImageUrl: e.target.value }))}
            />
          </div>
          <div className="mb-3 w-24">
            <SecondaryButton
              type="button"
              onClick={() => setDraft((prev) => ({ ...prev, backgroundImageUrl: undefined }))}
            >
              Clear
            </SecondaryButton>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Header</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          The nav bar at the top of the app, and the Calendar's weekday row.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="color"
            value={draft.headerColor ?? '#ffffff'}
            onChange={(e) => setDraft((prev) => ({ ...prev, headerColor: e.target.value }))}
            className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 dark:border-slate-700"
          />
          <div className="w-40">
            <FormField
              label="Header color hex"
              type="text"
              value={draft.headerColor ?? ''}
              placeholder="Default (light/dark)"
              onChange={(e) => setDraft((prev) => ({ ...prev, headerColor: e.target.value || undefined }))}
            />
          </div>
          <div className="mb-3 w-24">
            <SecondaryButton type="button" onClick={() => setDraft((prev) => ({ ...prev, headerColor: undefined }))}>
              Clear
            </SecondaryButton>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Layout</h2>
        <div className="mt-2 flex gap-2">
          {(['default', 'simple', 'custom'] as LayoutMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDraft((prev) => applyLayoutMode(mode, prev))}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                draft.layoutMode === mode
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {draft.layoutMode === 'custom' && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={draft.showBranding}
                onChange={(e) => setDraft((prev) => ({ ...prev, showBranding: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Show "ForecastFlow" branding in the header
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={draft.compactNav}
                onChange={(e) => setDraft((prev) => ({ ...prev, compactNav: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              Compact, grouped navigation
            </label>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Home screen</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Applies the next time you add this site to your phone's home screen -- it can't update an icon
          you've already added.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <FormField
            label="Home screen name"
            type="text"
            placeholder="ForecastFlow"
            value={draft.homeScreenName ?? ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, homeScreenName: e.target.value }))}
          />
          <FormField
            label="Home screen icon URL"
            type="text"
            placeholder="https://..."
            value={draft.homeScreenIconUrl ?? ''}
            onChange={(e) => setDraft((prev) => ({ ...prev, homeScreenIconUrl: e.target.value }))}
          />
        </div>
      </section>

      {message && <p className="mt-4 text-sm text-green-700 dark:text-green-400">{message}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <div className="w-28">
          <PrimaryButton type="button" onClick={handleSave} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </PrimaryButton>
        </div>
        <div className="w-32">
          <SecondaryButton type="button" onClick={handleDiscard}>
            Don't Save
          </SecondaryButton>
        </div>
        <div className="w-24">
          <SecondaryButton type="button" onClick={handleDiscard}>
            Load
          </SecondaryButton>
        </div>
        <div className="w-40">
          <SecondaryButton type="button" onClick={handleResetDraft}>
            Reset to Default
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}
