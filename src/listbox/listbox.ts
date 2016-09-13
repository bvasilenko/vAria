
import { createTypeahead } from '../core/typeahead.js'
import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface ListboxOptions {
  readonly multiselect?: boolean
  readonly onSelect?: (values: string[], options: HTMLElement[]) => void
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/listbox/

function ensureId(el: HTMLElement, prefix: string): string {
  if (!el.id) el.id = `${prefix}-${Math.random().toString(36).slice(2)}`
  return el.id
}

function getSelectedValues(listbox: HTMLElement): Array<{ value: string; el: HTMLElement }> {
  return Array.from(listbox.querySelectorAll<HTMLElement>('[role="option"][aria-selected="true"]'))
    .map((el) => ({ value: el.getAttribute('data-value') ?? el.textContent, el }))
}

function initListbox(root: HTMLElement, options: ListboxOptions): Disposer {
  const multiselect = options.multiselect ?? root.getAttribute('aria-multiselectable') === 'true'

  root.setAttribute('role', 'listbox')
  root.setAttribute('aria-multiselectable', String(multiselect))
  if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0')

  const optionEls = Array.from(root.querySelectorAll<HTMLElement>('[data-option]'))
  optionEls.forEach((opt) => {
    opt.setAttribute('role', 'option')
    if (!opt.hasAttribute('aria-selected')) opt.setAttribute('aria-selected', 'false')
    ensureId(opt, 'v-option')
  })

  let activeIndex = 0
  let rangeAnchor = 0

  function getOptions(): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])'))
  }

  function setActive(idx: number): void {
    const opts = getOptions()
    if (opts.length === 0) return
    activeIndex = Math.max(0, Math.min(idx, opts.length - 1))
    const active = opts[activeIndex]
    if (active) {
      root.setAttribute('aria-activedescendant', active.id)
      active.scrollIntoView({ block: 'nearest' })
    }
  }

  function selectOnly(idx: number): void {
    const opts = getOptions()
    opts.forEach((opt, i) => { opt.setAttribute('aria-selected', i === idx ? 'true' : 'false') })
    rangeAnchor = idx
    options.onSelect?.(getSelectedValues(root).map((s) => s.value), getSelectedValues(root).map((s) => s.el))
  }

  function toggleSelect(idx: number): void {
    const opts = getOptions()
    const opt = opts[idx]
    if (!opt) return
    const next = opt.getAttribute('aria-selected') !== 'true'
    opt.setAttribute('aria-selected', String(next))
    options.onSelect?.(getSelectedValues(root).map((s) => s.value), getSelectedValues(root).map((s) => s.el))
  }

  function selectRange(from: number, to: number): void {
    const opts = getOptions()
    const [start, end] = [Math.min(from, to), Math.max(from, to)]
    opts.forEach((opt, i) => {
      if (i >= start && i <= end) opt.setAttribute('aria-selected', 'true')
    })
    options.onSelect?.(getSelectedValues(root).map((s) => s.value), getSelectedValues(root).map((s) => s.el))
  }

  const typeahead = createTypeahead({
    getItems: getOptions,
    onMatch: (_item, idx) => {
      setActive(idx)
      if (!multiselect) selectOnly(idx)
    },
  })

  const onKeydown = (event: KeyboardEvent): void => {
    const opts = getOptions()
    const len = opts.length
    if (len === 0) return

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault()
        const next = Math.min(activeIndex + 1, len - 1)
        setActive(next)
        if (!multiselect) selectOnly(next)
        else if (event.shiftKey) selectRange(rangeAnchor, next)
        break
      }
      case 'ArrowUp': {
        event.preventDefault()
        const prev = Math.max(activeIndex - 1, 0)
        setActive(prev)
        if (!multiselect) selectOnly(prev)
        else if (event.shiftKey) selectRange(rangeAnchor, prev)
        break
      }
      case 'Home': {
        event.preventDefault()
        setActive(0)
        if (!multiselect) selectOnly(0)
        else if (event.shiftKey) selectRange(rangeAnchor, 0)
        break
      }
      case 'End': {
        event.preventDefault()
        setActive(len - 1)
        if (!multiselect) selectOnly(len - 1)
        else if (event.shiftKey) selectRange(rangeAnchor, len - 1)
        break
      }
      case ' ':
        event.preventDefault()
        if (multiselect) toggleSelect(activeIndex)
        else selectOnly(activeIndex)
        break
      default:
        typeahead.handleKey(event.key)
    }
  }

  const onClick = (event: Event): void => {
    const target = (event.target as Element).closest<HTMLElement>('[role="option"]')
    if (!target) return
    const opts = getOptions()
    const idx = opts.indexOf(target)
    if (idx === -1) return
    setActive(idx)
    if (multiselect && (event as MouseEvent).shiftKey) {
      selectRange(rangeAnchor, idx)
    } else if (multiselect && ((event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey)) {
      toggleSelect(idx)
    } else {
      selectOnly(idx)
    }
  }

  root.addEventListener('keydown', onKeydown)
  root.addEventListener('click', onClick)

  setActive(0)

  return () => {
    root.removeEventListener('keydown', onKeydown)
    root.removeEventListener('click', onClick)
    typeahead.reset()
    root.removeAttribute('role')
    root.removeAttribute('aria-multiselectable')
    root.removeAttribute('aria-activedescendant')
    root.removeAttribute('tabindex')
    optionEls.forEach((opt) => {
      opt.removeAttribute('role')
      opt.removeAttribute('aria-selected')
    })
  }
}

export function attach(root: HTMLElement, options: ListboxOptions = {}): Disposer {
  return guardIdempotent(root, () => initListbox(root, options))
}
