
export type Orientation = 'horizontal' | 'vertical' | 'both'

export interface RovingTabindexOptions {
  readonly orientation?: Orientation
  readonly wrap?: boolean
  readonly onActivate?: (item: HTMLElement, index: number) => void
}

export interface RovingTabindex {
  readonly focus: (index: number) => void
  readonly focusCurrent: () => void
  readonly getItems: () => HTMLElement[]
  readonly dispose: () => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function resolveNext(
  current: number,
  total: number,
  delta: number,
  wrap: boolean,
): number {
  if (wrap) return ((current + delta) % total + total) % total
  return clamp(current + delta, 0, total - 1)
}

export function createRovingTabindex(
  getItems: () => HTMLElement[],
  options: RovingTabindexOptions = {},
): RovingTabindex {
  const { orientation = 'both', wrap = true, onActivate } = options
  let currentIndex = 0

  function applyTabindices(items: HTMLElement[], activeIndex: number): void {
    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === activeIndex ? '0' : '-1')
    })
  }

  function moveTo(index: number): void {
    const items = getItems()
    if (items.length === 0) return
    const safeIndex = clamp(index, 0, items.length - 1)
    currentIndex = safeIndex
    applyTabindices(items, safeIndex)
    items[safeIndex]?.focus()
    onActivate?.(items[safeIndex] as HTMLElement, safeIndex)
  }

  function handleKeydown(event: KeyboardEvent): void {
    const items = getItems()
    if (items.length === 0) return

    const idx = items.indexOf(event.target as HTMLElement)
    if (idx === -1) return

    const goesNext =
      (orientation === 'horizontal' || orientation === 'both') && event.key === 'ArrowRight' ||
      (orientation === 'vertical' || orientation === 'both') && event.key === 'ArrowDown'
    const goesPrev =
      (orientation === 'horizontal' || orientation === 'both') && event.key === 'ArrowLeft' ||
      (orientation === 'vertical' || orientation === 'both') && event.key === 'ArrowUp'
    const goesFirst = event.key === 'Home'
    const goesLast = event.key === 'End'

    if (!goesNext && !goesPrev && !goesFirst && !goesLast) return

    event.preventDefault()

    if (goesFirst) { moveTo(0); return }
    if (goesLast) { moveTo(items.length - 1); return }
    if (goesNext) { moveTo(resolveNext(idx, items.length, 1, wrap)); return }
    if (goesPrev) { moveTo(resolveNext(idx, items.length, -1, wrap)); return }
  }

  function activate(item: HTMLElement, index: number): void {
    item.addEventListener('keydown', handleKeydown)
    item.setAttribute('tabindex', index === 0 ? '0' : '-1')
  }

  function mount(): void {
    const items = getItems()
    items.forEach((item, i) => { activate(item, i) })
  }

  function dispose(): void {
    const items = getItems()
    items.forEach((item) => {
      item.removeEventListener('keydown', handleKeydown)
      item.removeAttribute('tabindex')
    })
  }

  mount()

  return {
    focus: moveTo,
    focusCurrent: () => { moveTo(currentIndex) },
    getItems,
    dispose,
  }
}
