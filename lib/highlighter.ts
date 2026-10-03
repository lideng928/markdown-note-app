/**
 * Lazily-loaded Shiki highlighter, shared across every code block.
 *
 * Shiki is imported on first use rather than bundled into the app shell, and
 * grammars load one language at a time, so a note with a single `ts` fence never
 * pays for the other eighty languages.
 *
 * Both themes are emitted at once as CSS variables (`defaultColor: false`), which
 * means switching light/dark is a pure CSS swap — no re-highlighting, no flash.
 */

// Type-only: erased at compile time, so this does not pull Shiki into the bundle.
import type { BundledLanguage, Highlighter } from 'shiki'

export const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const

/** Guards `loadLanguage` against arbitrary strings from a fence info string. */
const LANG_PATTERN = /^[a-z0-9][a-z0-9+#._-]{0,24}$/

let highlighterPromise: Promise<Highlighter> | null = null
const loaded = new Set<string>()
const unsupported = new Set<string>()

/** Shiki's own aliases cover most of these; these are the ones it doesn't. */
const ALIASES: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  node: 'javascript',
  plaintext: 'text',
  txt: 'text',
}

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = import('shiki')
      .then((shiki) =>
        shiki.createHighlighter({
          themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark],
          langs: [],
        }),
      )
      .catch((error) => {
        // Let a later block retry rather than poisoning the singleton forever.
        highlighterPromise = null
        throw error
      })
  }
  return highlighterPromise
}

/**
 * Highlight `code` as `lang`, or resolve to null when the language is unknown or
 * Shiki fails to load — the caller then shows the code unhighlighted.
 */
export async function highlight(code: string, lang: string | undefined): Promise<string | null> {
  if (!lang) return null
  const normalized = ALIASES[lang.toLowerCase().trim()] ?? lang.toLowerCase().trim()
  if (!LANG_PATTERN.test(normalized) || unsupported.has(normalized)) return null

  let highlighter: Highlighter
  try {
    highlighter = await getHighlighter()
  } catch {
    return null
  }

  if (!loaded.has(normalized)) {
    try {
      await highlighter.loadLanguage(normalized as BundledLanguage)
      loaded.add(normalized)
    } catch {
      unsupported.add(normalized)
      return null
    }
  }

  try {
    return highlighter.codeToHtml(code, {
      lang: normalized,
      themes: SHIKI_THEMES,
      defaultColor: false,
    })
  } catch {
    return null
  }
}
