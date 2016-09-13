
import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export type AutocompleteMode = 'none' | 'list' | 'both' | 'inline'

export interface ComboboxOptions {
  readonly autocomplete?: AutocompleteMode
  readonly onSelect?: (value: string, option: HTMLElement) => void
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

function ensureId(el: HTMLElement, prefix: string): string {
  if (!el.id) el.id = `${prefix}-${Math.random().toString(36).slice(2)}`
  return el.id
}

function getVisibleOptions(listbox: HTMLElement): HTMLElement[] {
  return Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"]')).filter(
    (opt) => !opt.hidden && opt.getAttribute('aria-hidden') !== 'true',
  )
}

function scrollOptionIntoView(option: HTMLElement): void {
  option.scrollIntoView({ block: 'nearest' })
}

function setActiveDescendant(input: HTMLElement, option: HTMLElement | null): void {
  if (option?.id) {
    input.setAttribute('aria-activedescendant', option.id)
    option.setAttribute('aria-selected', 'true')
    scrollOptionIntoView(option)
  } else {
    input.removeAttribute('aria-activedescendant')
  }
}

function clearSelection(listbox: HTMLElement): void {
  listbox.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]').forEach((opt) => {
    opt.setAttribute('aria-selected', 'false')
  })
}

function setExpanded(input: HTMLElement, listbox: HTMLElement, expanded: boolean): void {
  input.setAttribute('aria-expanded', String(expanded))
  listbox.setAttribute('data-state', expanded ? 'open' : 'closed')
  if (expanded) listbox.removeAttribute('hidden')
  else {
    listbox.setAttribute('hidden', '')
    input.removeAttribute('aria-activedescendant')
  }
}

function filterOptions(listbox: HTMLElement, phrase: string, mode: AutocompleteMode): void {
  if (mode === 'none') return
  const lower = phrase.toLowerCase()
  listbox.querySelectorAll<HTMLElement>('[role="option"]').forEach((opt) => {
    const text = opt.textContent.toLowerCase()
    const visible = lower.length === 0 || text.includes(lower)
    opt.hidden = !visible
    opt.setAttribute('aria-hidden', String(!visible))
  })
}

function initComboboxInner(
  root: HTMLElement,
  input: HTMLInputElement,
  listbox: HTMLElement,
  options: ComboboxOptions,
): Disposer {
  const autocomplete = options.autocomplete ?? 'list'

  const listboxId = ensureId(listbox, 'v-combobox-listbox')
  ensureId(input, 'v-combobox-input')

  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-haspopup', 'listbox')
  input.setAttribute('aria-controls', listboxId)
  input.setAttribute('aria-autocomplete', autocomplete)
  input.setAttribute('aria-expanded', 'false')

  listbox.querySelectorAll<HTMLElement>('[data-option]').forEach((opt) => {
    opt.setAttribute('role', 'option')
    if (!opt.hasAttribute('aria-selected')) opt.setAttribute('aria-selected', 'false')
    ensureId(opt, 'v-combobox-opt')
  })

  const cleanups: Disposer[] = []
  let suppressNextFocus = false

  function openList(): void {
    setExpanded(input, listbox, true)
  }

  function closeList(): void {
    clearSelection(listbox)
    setExpanded(input, listbox, false)
  }

  function selectOption(option: HTMLElement): void {
    const value = option.getAttribute('data-value') ?? option.textContent
    input.value = value
    options.onSelect?.(value, option)
    closeList()
    suppressNextFocus = true
    input.focus()
  }

  function getActiveOption(): HTMLElement | null {
    const id = input.getAttribute('aria-activedescendant')
    return id ? document.getElementById(id) : null
  }

  function navigateOptions(delta: number): void {
    const visible = getVisibleOptions(listbox)
    if (visible.length === 0) return
    const current = getActiveOption()
    const currentIdx = current ? visible.indexOf(current) : -1
    const nextIdx = currentIdx === -1
      ? (delta > 0 ? 0 : visible.length - 1)
      : ((currentIdx + delta) % visible.length + visible.length) % visible.length
    clearSelection(listbox)
    const next = visible[nextIdx]
    if (next) setActiveDescendant(input, next)
  }

  const onInput = (): void => {
    filterOptions(listbox, input.value, autocomplete)
    if (!listbox.hidden) return
    openList()
  }

  const onFocus = (): void => {
    if (suppressNextFocus) { suppressNextFocus = false; return }
    openList()
  }

  const onKeydown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (listbox.hidden) openList()
        else navigateOptions(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (listbox.hidden) openList()
        else navigateOptions(-1)
        break
      case 'Enter': {
        const active = getActiveOption()
        if (active) { event.preventDefault(); selectOption(active) }
        break
      }
      case 'Escape':
        event.preventDefault()
        closeList()
        break
      case 'Tab':
        closeList()
        break
    }
  }

  const outsideClick = (event: Event): void => {
    if (!root.contains(event.target as Node)) closeList()
  }

  input.addEventListener('focus', onFocus)
  input.addEventListener('input', onInput)
  input.addEventListener('keydown', onKeydown)
  document.addEventListener('pointerdown', outsideClick)

  listbox.querySelectorAll<HTMLElement>('[role="option"]').forEach((opt) => {
    const onPointerdown = (e: Event): void => { e.preventDefault() }
    const onClick = (): void => { selectOption(opt) }
    opt.addEventListener('pointerdown', onPointerdown)
    opt.addEventListener('click', onClick)
    cleanups.push(() => {
      opt.removeEventListener('pointerdown', onPointerdown)
      opt.removeEventListener('click', onClick)
    })
  })

  cleanups.push(() => {
    input.removeEventListener('focus', onFocus)
    input.removeEventListener('input', onInput)
    input.removeEventListener('keydown', onKeydown)
    document.removeEventListener('pointerdown', outsideClick)
    input.removeAttribute('role')
    input.removeAttribute('aria-haspopup')
    input.removeAttribute('aria-controls')
    input.removeAttribute('aria-autocomplete')
    input.removeAttribute('aria-expanded')
    input.removeAttribute('aria-activedescendant')
    listbox.removeAttribute('data-state')
    listbox.removeAttribute('hidden')
  })

  return () => { cleanups.forEach((fn) => { fn() }) }
}

function initCombobox(root: HTMLElement, options: ComboboxOptions): Disposer {
  const input = root.querySelector<HTMLInputElement>('input')
  const listbox = root.querySelector<HTMLElement>('[role="listbox"]')
  if (!input || !listbox) return () => { /* missing required elements */ }
  return initComboboxInner(root, input, listbox, options)
}

export function attach(root: HTMLElement, options: ComboboxOptions = {}): Disposer {
  return guardIdempotent(root, () => initCombobox(root, options))
}
