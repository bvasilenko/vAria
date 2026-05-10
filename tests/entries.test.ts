// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, vi } from 'vitest'
import { attach } from '../src/entries/all.js'
import { useMountFixture } from './helpers.js'

const mount = useMountFixture()

describe('entries/index barrel', () => {
  it('exports all pattern attach functions', async () => {
    const mod = await import('../src/entries/index.js')
    const keys = Object.keys(mod)
    expect(keys).toContain('dialog')
    expect(keys).toContain('accordion')
    expect(keys).toContain('tabs')
    expect(keys).toContain('combobox')
    expect(keys).toContain('tooltip')
    expect(keys).toContain('alert')
    expect(keys).toContain('disclosure')
    expect(keys).toContain('menu')
    expect(keys).toContain('menubutton')
    expect(keys).toContain('listbox')
    expect(keys).toContain('switchPattern')
  })

  it('exports all core utilities', async () => {
    const mod = await import('../src/entries/index.js')
    const keys = Object.keys(mod)
    expect(keys).toContain('createFocusTrap')
    expect(keys).toContain('createRovingTabindex')
    expect(keys).toContain('onKey')
    expect(keys).toContain('onKeyPreventDefault')
    expect(keys).toContain('guardIdempotent')
  })
})

describe('entries/all attach(root)', () => {
  it('wires every recognized data-v-pattern element within the subtree', () => {
    const root = mount(`
      <div>
        <div data-v-pattern="disclosure">
          <button data-disclosure-trigger>Toggle</button>
          <div data-disclosure-panel>Panel</div>
        </div>
        <div data-v-pattern="alert">Alert text</div>
      </div>`)
    attach(root)
    const trigger = root.querySelector('[data-disclosure-trigger]') as HTMLElement
    const alertEl = root.querySelector('[data-v-pattern="alert"]') as HTMLElement
    expect(trigger.getAttribute('aria-expanded')).toBeDefined()
    expect(alertEl.getAttribute('role')).toBe('alert')
  })

  it('skips elements with unrecognized pattern names without throwing', () => {
    const root = mount('<div><div data-v-pattern="nonexistent">X</div></div>')
    expect(() => { attach(root) }).not.toThrow()
  })

  it('skips elements with an empty data-v-pattern value', () => {
    const root = mount('<div><div data-v-pattern="">X</div></div>')
    expect(() => { attach(root) }).not.toThrow()
  })

  it('returned disposer removes ARIA state from all wired patterns', () => {
    const root = mount(`
      <div>
        <div data-v-pattern="alert" id="a1">A</div>
        <div data-v-pattern="alert" id="a2">B</div>
      </div>`)
    const alerts = Array.from(root.querySelectorAll<HTMLElement>('[data-v-pattern="alert"]'))
    const dispose = attach(root)
    alerts.forEach((a) => { expect(a.getAttribute('role')).toBe('alert') })
    dispose()
    alerts.forEach((a) => { expect(a.getAttribute('role')).toBeNull() })
  })

  it('attach() with no argument targets document.documentElement', () => {
    const el = document.createElement('div')
    el.setAttribute('data-v-pattern', 'alert')
    el.textContent = 'Global alert'
    document.documentElement.appendChild(el)
    const dispose = attach()
    expect(el.getAttribute('role')).toBe('alert')
    dispose()
    el.remove()
  })
})

describe('entries/all — DOMContentLoaded auto-attach path', () => {
  it('registers DOMContentLoaded listener when document.readyState is loading', async () => {
    const original = Object.getOwnPropertyDescriptor(Document.prototype, 'readyState')
    Object.defineProperty(document, 'readyState', { get: () => 'loading', configurable: true })

    const addEventSpy = vi.spyOn(document, 'addEventListener')
    vi.resetModules()
    await import('../src/entries/all.js')

    const calls = addEventSpy.mock.calls.filter((c) => c[0] === 'DOMContentLoaded')
    expect(calls.length).toBeGreaterThan(0)

    if (original) Object.defineProperty(document, 'readyState', original)
    addEventSpy.mockRestore()
    vi.resetModules()
  })
})

describe('entries/all — DOMContentLoaded callback invocation', () => {
  it('attach() runs when DOMContentLoaded fires after module load with loading readyState', async () => {
    const original = Object.getOwnPropertyDescriptor(Document.prototype, 'readyState')
    Object.defineProperty(document, 'readyState', { get: () => 'loading', configurable: true })

    vi.resetModules()
    await import('../src/entries/all.js')

    const el = document.createElement('div')
    el.setAttribute('data-v-pattern', 'alert')
    el.textContent = 'Alert content'
    document.documentElement.appendChild(el)

    document.dispatchEvent(new Event('DOMContentLoaded'))

    expect(el.getAttribute('role')).toBe('alert')

    el.remove()
    if (original) Object.defineProperty(document, 'readyState', original)
    vi.resetModules()
  })
})
