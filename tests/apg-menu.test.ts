
import { describe, it, expect, afterEach, vi } from 'vitest'
import { attach } from '../src/menu/menu.js'
import { createEl, cleanup, press } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

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
