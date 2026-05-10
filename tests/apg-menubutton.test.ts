// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, vi } from 'vitest'
import { attach } from '../src/menubutton/menubutton.js'
import { useMountFixture, press, click } from './helpers.js'

const mount = useMountFixture()

function buildMenubutton(): { root: HTMLElement; btn: HTMLElement; menu: HTMLElement; items: HTMLElement[] } {
  const root = mount(`
    <div>
      <button data-menubutton-trigger>Actions</button>
      <div data-menu>
        <div data-menu-item>Edit</div>
        <div data-menu-item>Delete</div>
      </div>
    </div>`)
  const btn = root.querySelector<HTMLElement>('[data-menubutton-trigger]') as HTMLElement
  const menu = root.querySelector<HTMLElement>('[data-menu]') as HTMLElement
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-menu-item]'))
  return { root, btn, menu, items }
}

describe('APG menubutton', () => {
  it('sets aria-haspopup=menu and aria-expanded=false on button', () => {
    const { root, btn } = buildMenubutton()
    attach(root)
    expect(btn.getAttribute('aria-haspopup')).toBe('menu')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('sets aria-controls pointing to menu id', () => {
    const { root, btn, menu } = buildMenubutton()
    attach(root)
    expect(btn.getAttribute('aria-controls')).toBe(menu.id)
  })

  it('click opens menu, sets aria-expanded=true', () => {
    const { root, btn, menu } = buildMenubutton()
    attach(root)
    click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(menu.hasAttribute('hidden')).toBe(false)
  })

  it('second click closes menu', () => {
    const { root, btn, menu } = buildMenubutton()
    attach(root)
    click(btn)
    click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    expect(menu.hasAttribute('hidden')).toBe(true)
  })

  it('ArrowDown opens menu and focuses first item', () => {
    const { root, btn, items } = buildMenubutton()
    attach(root)
    btn.focus()
    press(btn, 'ArrowDown')
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(items[0])
  })

  it('ArrowUp opens menu and focuses last item', () => {
    const { root, btn, items } = buildMenubutton()
    attach(root)
    btn.focus()
    press(btn, 'ArrowUp')
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(items[1])
  })

  it('Enter on button opens menu and focuses first item', () => {
    const { root, btn, items } = buildMenubutton()
    attach(root)
    btn.focus()
    press(btn, 'Enter')
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(items[0])
  })

  it('Space on button opens menu and focuses first item', () => {
    const { root, btn, items } = buildMenubutton()
    attach(root)
    btn.focus()
    press(btn, ' ')
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(items[0])
  })

  it('Escape closes menu and returns focus to button', () => {
    const { root, btn, menu } = buildMenubutton()
    attach(root)
    click(btn)
    press(menu, 'Escape')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    expect(menu.hasAttribute('hidden')).toBe(true)
    expect(document.activeElement).toBe(btn)
  })

  it('Tab key closes menu', () => {
    const { root, btn, menu } = buildMenubutton()
    attach(root)
    click(btn)
    press(menu, 'Tab')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    expect(menu.hasAttribute('hidden')).toBe(true)
  })
})

describe('APG menubutton — guard: missing menu element', () => {
  it('attach returns a callable no-op when no [data-menu] element exists', () => {
    const root = mount('<div><button data-menubutton-trigger>Actions</button></div>')
    const dispose = attach(root)
    expect(() => { dispose() }).not.toThrow()
  })
})

describe('APG menubutton — onOpen and onClose callbacks', () => {
  it('onOpen fires when menu opens via click', () => {
    const { root, btn } = buildMenubutton()
    const onOpen = vi.fn()
    attach(root, { onOpen })
    click(btn)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('onClose fires when menu closes via click', () => {
    const { root, btn } = buildMenubutton()
    const onClose = vi.fn()
    attach(root, { onClose })
    click(btn)
    click(btn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('onClose fires when menu closes via Escape', () => {
    const { root, btn, menu } = buildMenubutton()
    const onClose = vi.fn()
    attach(root, { onClose })
    click(btn)
    press(menu, 'Escape')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('APG menubutton — outside click', () => {
  it('pointerdown outside root closes an open menu', () => {
    const { root, btn, menu } = buildMenubutton()
    attach(root)
    click(btn)
    expect(menu.hasAttribute('hidden')).toBe(false)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(menu.hasAttribute('hidden')).toBe(true)
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('pointerdown outside root when menu is already closed does not throw', () => {
    const { root } = buildMenubutton()
    attach(root)
    expect(() => {
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    }).not.toThrow()
  })
})

describe('APG menubutton — ArrowUp with no focusable menu items', () => {
  it('ArrowUp on button opens menu even when menu has no role-carrying items yet', () => {
    const root = mount(`
      <div>
        <button data-menubutton-trigger>Actions</button>
        <div data-menu></div>
      </div>`)
    const btn = root.querySelector<HTMLElement>('[data-menubutton-trigger]') as HTMLElement
    const menu = root.querySelector<HTMLElement>('[data-menu]') as HTMLElement
    attach(root)
    btn.focus()
    press(btn, 'ArrowUp')
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(menu.hasAttribute('hidden')).toBe(false)
  })
})

describe('APG menubutton — button fallback when no trigger attribute', () => {
  it('root element becomes the button when no [data-menubutton-trigger] child exists', () => {
    const root = mount(`
      <div>
        <div data-menu>
          <div data-menu-item>Edit</div>
        </div>
      </div>`)
    attach(root)
    expect(root.getAttribute('aria-haspopup')).toBe('menu')
    expect(root.getAttribute('aria-expanded')).toBe('false')
  })
})
