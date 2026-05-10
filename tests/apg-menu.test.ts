// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, vi } from 'vitest'
import { attach } from '../src/menu/menu.js'
import { useMountFixture, press } from './helpers.js'

const mount = useMountFixture()

function buildMenu(): { menu: HTMLElement; items: HTMLElement[] } {
  const menu = mount(`
    <div>
      <div data-menu-item>Cut</div>
      <div data-menu-item>Copy</div>
      <div data-menu-item>Paste</div>
    </div>`)
  const items = Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-item]'))
  return { menu, items }
}

describe('APG menu', () => {
  it('sets role=menu on container', () => {
    const { menu } = buildMenu()
    attach(menu)
    expect(menu.getAttribute('role')).toBe('menu')
  })

  it('sets role=menuitem on items', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items.forEach((item) => { expect(item.getAttribute('role')).toBe('menuitem') })
  })

  it('sets tabindex=-1 on all items', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items.forEach((item) => { expect(item.getAttribute('tabindex')).toBe('-1') })
  })

  it('ArrowDown moves focus to next item', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items[0]?.focus()
    press(menu, 'ArrowDown')
    expect(document.activeElement).toBe(items[1])
  })

  it('ArrowUp moves focus to previous item', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items[1]?.focus()
    press(menu, 'ArrowUp')
    expect(document.activeElement).toBe(items[0])
  })

  it('ArrowDown wraps from last to first', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items[2]?.focus()
    press(menu, 'ArrowDown')
    expect(document.activeElement).toBe(items[0])
  })

  it('ArrowUp wraps from first to last', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items[0]?.focus()
    press(menu, 'ArrowUp')
    expect(document.activeElement).toBe(items[2])
  })

  it('Home focuses first item', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items[2]?.focus()
    press(menu, 'Home')
    expect(document.activeElement).toBe(items[0])
  })

  it('End focuses last item', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items[0]?.focus()
    press(menu, 'End')
    expect(document.activeElement).toBe(items[2])
  })

  it('typeahead focuses first item matching typed character', () => {
    const { menu, items } = buildMenu()
    attach(menu)
    items[0]?.focus()
    press(menu, 'p')
    expect(document.activeElement).toBe(items[2])
  })

  it('Enter triggers onSelect callback with the active item', () => {
    const { menu, items } = buildMenu()
    const onSelect = vi.fn()
    attach(menu, { onSelect })
    items[0]?.focus()
    press(menu, 'Enter')
    expect(onSelect).toHaveBeenCalledWith(items[0])
  })

  it('Space triggers onSelect callback with the active item', () => {
    const { menu, items } = buildMenu()
    const onSelect = vi.fn()
    attach(menu, { onSelect })
    items[1]?.focus()
    press(menu, ' ')
    expect(onSelect).toHaveBeenCalledWith(items[1])
  })
})

describe('APG menu — Enter/Space when no item has focus', () => {
  it('Enter with no prior navigation selects the item at the default internal index', () => {
    const { menu, items } = buildMenu()
    const onSelect = vi.fn()
    attach(menu, { onSelect })
    press(menu, 'Enter')
    expect(onSelect).toHaveBeenCalledWith(items[0])
  })

  it('Space with no prior navigation selects the item at the default internal index', () => {
    const { menu, items } = buildMenu()
    const onSelect = vi.fn()
    attach(menu, { onSelect })
    press(menu, ' ')
    expect(onSelect).toHaveBeenCalledWith(items[0])
  })

  it('Enter on menu with no enabled items does not throw', () => {
    const menu = mount(`
      <div>
        <div data-menu-item aria-disabled="true">Disabled</div>
      </div>`)
    attach(menu)
    expect(() => { press(menu, 'Enter') }).not.toThrow()
  })

  it('Space on menu with no enabled items does not throw', () => {
    const menu = mount(`
      <div>
        <div data-menu-item aria-disabled="true">Disabled</div>
      </div>`)
    attach(menu)
    expect(() => { press(menu, ' ') }).not.toThrow()
  })
})
