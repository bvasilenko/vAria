
import { describe, it, expect, afterEach } from 'vitest'
import { attach } from '../src/menubutton/menubutton.js'
import { createEl, cleanup, press, click } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

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
