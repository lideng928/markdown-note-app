/**
 * Small, non-critical UI preferences.
 *
 * Kept in their own storage key so a corrupt or evicted prefs blob can never take
 * the notes down with it — a bad read just falls back to the defaults.
 */

export type ViewMode = 'edit' | 'split' | 'preview'

const VIEW_MODES = ['edit', 'split', 'preview'] as const

export const PREFS_KEY = 'margin-prefs:v1'

export type Prefs = {
  viewMode: ViewMode
  /** Which note was open, so a refresh doesn't lose your place. */
  activeId: string | null
}

export const DEFAULT_PREFS: Prefs = { viewMode: 'split', activeId: null }

function isViewMode(value: unknown): value is ViewMode {
  return typeof value === 'string' && (VIEW_MODES as readonly string[]).includes(value)
}

export function parsePrefs(raw: string | null): Prefs {
  if (raw === null) return DEFAULT_PREFS
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFS
    const prefs = parsed as Record<string, unknown>
    return {
      viewMode: isViewMode(prefs.viewMode) ? prefs.viewMode : DEFAULT_PREFS.viewMode,
      activeId: typeof prefs.activeId === 'string' ? prefs.activeId : null,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function loadPrefs(): Prefs {
  try {
    return parsePrefs(window.localStorage.getItem(PREFS_KEY))
  } catch {
    return DEFAULT_PREFS
  }
}

/**
 * Merge a partial update into the stored preferences.
 *
 * Merging rather than replacing lets the notes hook own `activeId` and the app
 * shell own `viewMode` without either clobbering the other's key.
 */
export function savePrefs(update: Partial<Prefs>) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify({ ...loadPrefs(), ...update }))
  } catch {
    // Preferences are cosmetic; losing them is not worth surfacing.
  }
}
