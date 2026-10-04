import { expect, test, type Page } from '@playwright/test'

/** The editor textarea, which is also the source of truth for the note body. */
const editor = (page: Page) => page.locator('#note-content')
const preview = (page: Page) => page.getByRole('region', { name: 'Preview' })
/** Scoped to the header: Next's dev-tools badge also carries a data-status attribute. */
const saveStatus = (page: Page) => page.locator('header p[data-status]')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  // A fresh profile seeds the welcome note; wait for it before asserting.
  await expect(editor(page)).toHaveValue(/Welcome to Margin/, { timeout: 30_000 })
})

test('renders the welcome note with highlighting, math and a diagram', async ({ page }) => {
  // Shiki, KaTeX and Mermaid all load lazily, so each gets room to arrive.
  await expect(preview(page).locator('pre.shiki').first()).toBeVisible({ timeout: 30_000 })
  await expect(preview(page).locator('.katex').first()).toBeVisible()
  await expect(preview(page).locator('svg[id^="mermaid-"]').first()).toBeVisible({
    timeout: 30_000,
  })
})

test('creates a note, renders it, and keeps it across a reload', async ({ page }) => {
  await page.getByRole('button', { name: 'New' }).click()
  await page.locator('#note-title').fill('Durability check')
  await editor(page).fill('# Hello\n\nSome **bold** text.')

  await expect(preview(page).getByRole('heading', { name: 'Hello' })).toBeVisible()
  await expect(preview(page).locator('strong')).toHaveText('bold')

  // Outlast the 600ms save debounce.
  await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved', { timeout: 10_000 })
  await page.reload()

  await expect(page.locator('#note-title')).toHaveValue('Durability check')
  await expect(editor(page)).toHaveValue('# Hello\n\nSome **bold** text.')
})

test('a preview checkbox writes back to the markdown source', async ({ page }) => {
  await page.getByRole('button', { name: 'New' }).click()
  await editor(page).fill('- [ ] first\n- [ ] second')

  const second = preview(page).getByRole('checkbox').nth(1)
  await expect(second).toBeEnabled()
  await second.check()

  await expect(editor(page)).toHaveValue('- [ ] first\n- [x] second')
  await expect(preview(page).getByRole('checkbox').first()).not.toBeChecked()
})

test('Tab indents every selected line instead of replacing the selection', async ({ page }) => {
  await page.getByRole('button', { name: 'New' }).click()
  await editor(page).fill('one\ntwo\nthree')

  await editor(page).press('ControlOrMeta+a')
  await editor(page).press('Tab')
  await expect(editor(page)).toHaveValue('  one\n  two\n  three')

  await editor(page).press('ControlOrMeta+a')
  await editor(page).press('Shift+Tab')
  await expect(editor(page)).toHaveValue('one\ntwo\nthree')
})

test('shares a note through the URL fragment with no request carrying it', async ({ page }) => {
  await page.getByRole('button', { name: 'New' }).click()
  await page.locator('#note-title').fill('Shared note')
  // No leading heading, so the reader page supplies the title itself.
  await editor(page).fill('Travelled in the fragment.')

  await page.getByRole('button', { name: 'Share note' }).click()
  const link = page.getByLabel('Share link')
  await expect(link).not.toHaveValue('Preparing link…')
  const url = await link.inputValue()

  expect(url).toContain('/read#')

  // Nothing after the '#' may reach the server.
  const payload = url.split('#')[1]
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))

  await page.goto(url)
  await expect(page.getByRole('heading', { name: 'Shared note' })).toBeVisible()
  await expect(page.getByText('Travelled in the fragment.')).toBeVisible()
  expect(requested.some((entry) => entry.includes(payload))).toBe(false)
})

test('a corrupt share link fails with a message instead of a blank page', async ({ page }) => {
  await page.goto('/read#Cnot-a-real-payload')
  await expect(page.getByRole('heading', { name: /didn.t open/ })).toBeVisible()
})

test('remembers the chosen view mode across a reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Preview' }).click()
  await expect(editor(page)).toBeHidden()

  await page.reload()
  await expect(preview(page)).toBeVisible({ timeout: 30_000 })
  await expect(editor(page)).toBeHidden()
})

test('exports the open note as a markdown file', async ({ page }) => {
  await page.getByRole('button', { name: 'Notes menu' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('menuitem', { name: /Export this note/ }).click()

  const file = await download
  expect(file.suggestedFilename()).toBe('welcome-to-margin.md')
})

test('reports a failed save instead of showing "Saved"', async ({ page }) => {
  // Simulated rather than filled for real: overwriting an existing key with a
  // smaller value frees space, so an exhausted quota does not reliably reject
  // the next write. Throwing directly exercises the path that matters.
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === 'markdown-notes:v1') {
        throw new DOMException('Quota exceeded', 'QuotaExceededError')
      }
      return setItem.call(this, key, value)
    }
  })
  await page.reload()
  await expect(editor(page)).toHaveValue(/Welcome to Margin/, { timeout: 30_000 })

  await editor(page).fill('this cannot be saved')

  await expect(saveStatus(page)).toHaveAttribute('data-status', 'error', { timeout: 10_000 })
  await expect(page.locator('header p[role="status"]')).toContainText('could not be saved')
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('keeps the closed drawer out of the tab order and the editor at 16px', async ({ page }) => {
    const sidebar = page.locator('#notes-sidebar')
    await expect(sidebar).toHaveAttribute('inert', '')

    // Under 16px, iOS Safari zooms the page when the field takes focus.
    const fontSize = await editor(page).evaluate((node) =>
      Number.parseFloat(getComputedStyle(node).fontSize),
    )
    expect(fontSize).toBeGreaterThanOrEqual(16)

    // Save state has to be reachable on a phone too.
    await expect(saveStatus(page)).toBeVisible()

    await page.getByRole('button', { name: 'Open notes list' }).click()
    await expect(sidebar).not.toHaveAttribute('inert', '')
    await expect(page.getByPlaceholder('Search notes')).toBeVisible()
  })
})

test('does not persist the welcome note until you actually write something', async ({ page }) => {
  const stored = () => page.evaluate(() => localStorage.getItem('markdown-notes:v1'))

  // Reloading fires pagehide, which used to flush the seeded note to storage —
  // freezing it, so later releases could never ship an updated welcome note.
  await page.reload()
  await expect(editor(page)).toHaveValue(/Welcome to Margin/, { timeout: 30_000 })
  expect(await stored()).toBeNull()

  // Editing makes it the reader's own note, and from then on it persists.
  await editor(page).fill('now it is mine')
  await expect(saveStatus(page)).toHaveAttribute('data-status', 'saved', { timeout: 10_000 })
  expect(await stored()).toContain('now it is mine')

  await page.reload()
  await expect(editor(page)).toHaveValue('now it is mine', { timeout: 30_000 })
})
