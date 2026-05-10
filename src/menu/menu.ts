// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { createTypeahead } from '../core/typeahead.js'
import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface MenuOptions {
  readonly onSelect?: (item: HTMLElement) => void
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/

function ensureId(el: HTMLElement, prefix: string): string {
  if (!el.id) el.id = `${prefix}-${Math.random().toString(36).slice(2)}`
  return el.id
}

function getMenuItems(menu: HTMLElement): HTMLElement[] {
  return Array.from(
    menu.querySelectorAll<HTMLElement>(
      '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]',
    ),
  ).filter(
    (item) =>
      item.getAttribute('aria-disabled') !== 'true' &&
      item.closest('[role="menu"]') === menu,
  )
}

export function initMenu(menu: HTMLElement, options: MenuOptions): Disposer {
  menu.setAttribute('role', 'menu')

  const items = Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-item]'))
  items.forEach((item) => {
    item.setAttribute('role', 'menuitem')
    item.setAttribute('tabindex', '-1')
    ensureId(item, 'v-menuitem')
  })

  let focusedIndex = 0

  function focusItem(idx: number): void {
    const live = getMenuItems(menu)
    const clamped = Math.max(0, Math.min(idx, live.length - 1))
    focusedIndex = clamped
    live[clamped]?.focus()
  }

  const typeahead = createTypeahead({
    getItems: () => getMenuItems(menu),
    onMatch: (_item, idx) => { focusItem(idx) },
  })

  const onKeydown = (event: KeyboardEvent): void => {
    const live = getMenuItems(menu)
    const idx = live.indexOf(document.activeElement as HTMLElement)
    const current = idx === -1 ? focusedIndex : idx

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusItem((current + 1) % live.length)
        break
      case 'ArrowUp':
        event.preventDefault()
        focusItem((current - 1 + live.length) % live.length)
        break
      case 'Home':
        event.preventDefault()
        focusItem(0)
        break
      case 'End':
        event.preventDefault()
        focusItem(live.length - 1)
        break
      case 'Enter':
      case ' ': {
        event.preventDefault()
        const active = live[current]
        if (active) { active.click(); options.onSelect?.(active) }
        break
      }
      default:
        typeahead.handleKey(event.key)
    }
  }

  menu.addEventListener('keydown', onKeydown)

  return () => {
    menu.removeEventListener('keydown', onKeydown)
    typeahead.reset()
    menu.removeAttribute('role')
    items.forEach((item) => {
      item.removeAttribute('role')
      item.removeAttribute('tabindex')
    })
  }
}

export function attach(root: HTMLElement, options: MenuOptions = {}): Disposer {
  return guardIdempotent(root, () => initMenu(root, options))
}
