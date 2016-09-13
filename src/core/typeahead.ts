
const TYPEAHEAD_RESET_MS = 500

export interface TypeaheadOptions {
  readonly getItems: () => HTMLElement[]
  readonly onMatch: (item: HTMLElement, index: number) => void
}

export interface Typeahead {
  readonly handleKey: (key: string) => boolean
  readonly reset: () => void
}

export function createTypeahead(options: TypeaheadOptions): Typeahead {
  const { getItems, onMatch } = options
  let buffer = ''
  let timer: ReturnType<typeof setTimeout> | null = null

  function scheduleReset(): void {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => { buffer = ''; timer = null }, TYPEAHEAD_RESET_MS)
  }

  function handleKey(key: string): boolean {
    if (key.length !== 1) return false

    buffer += key.toLowerCase()
    scheduleReset()

    const items = getItems()
    const match = items.find((item) =>
      item.textContent.trim().toLowerCase().startsWith(buffer),
    )

    if (match) {
      onMatch(match, items.indexOf(match))
      return true
    }

    return false
  }

  function reset(): void {
    buffer = ''
    if (timer !== null) { clearTimeout(timer); timer = null }
  }

  return { handleKey, reset }
}
