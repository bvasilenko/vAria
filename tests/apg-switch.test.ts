// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, vi } from 'vitest'
import { attach } from '../src/switch/switch.js'
import { useMountFixture, press, click } from './helpers.js'

const mount = useMountFixture()

describe('APG switch', () => {
  it('sets role=switch and aria-checked=false by default', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    attach(el)
    const btn = el.querySelector('[data-switch]') as HTMLElement
    expect(btn.getAttribute('role')).toBe('switch')
    expect(btn.getAttribute('aria-checked')).toBe('false')
  })

  it('sets tabindex=0 if missing', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    attach(el)
    const btn = el.querySelector('[data-switch]') as HTMLElement
    expect(btn.getAttribute('tabindex')).toBe('0')
  })

  it('click toggles aria-checked', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    attach(el)
    const btn = el.querySelector('[data-switch]') as HTMLElement
    click(btn)
    expect(btn.getAttribute('aria-checked')).toBe('true')
    click(btn)
    expect(btn.getAttribute('aria-checked')).toBe('false')
  })

  it('Space toggles aria-checked', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    attach(el)
    const btn = el.querySelector('[data-switch]') as HTMLElement
    press(btn, ' ')
    expect(btn.getAttribute('aria-checked')).toBe('true')
  })

  it('Enter toggles aria-checked', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    attach(el)
    const btn = el.querySelector('[data-switch]') as HTMLElement
    press(btn, 'Enter')
    expect(btn.getAttribute('aria-checked')).toBe('true')
  })

  it('respects initial aria-checked=true', () => {
    const el = mount('<div><button data-switch aria-checked="true">Toggle</button></div>')
    attach(el)
    const btn = el.querySelector('[data-switch]') as HTMLElement
    expect(btn.getAttribute('aria-checked')).toBe('true')
    click(btn)
    expect(btn.getAttribute('aria-checked')).toBe('false')
  })

  it('sets data-state=checked/unchecked', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    attach(el)
    const btn = el.querySelector('[data-switch]') as HTMLElement
    click(btn)
    expect(btn.getAttribute('data-state')).toBe('checked')
    click(btn)
    expect(btn.getAttribute('data-state')).toBe('unchecked')
  })

  it('calls onChange callback', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    const onChange = vi.fn()
    attach(el, { onChange })
    const btn = el.querySelector('[data-switch]') as HTMLElement
    click(btn)
    expect(onChange).toHaveBeenCalledWith(true, btn)
  })

  it('onChange is called with false when switch is unchecked', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    const onChange = vi.fn()
    attach(el, { onChange })
    const btn = el.querySelector('[data-switch]') as HTMLElement
    click(btn)
    click(btn)
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith(false, btn)
  })

  it('multiple data-switch controls in one root are all initialized independently', () => {
    const el = mount('<div><button data-switch>A</button><button data-switch>B</button></div>')
    attach(el)
    const [a, b] = el.querySelectorAll<HTMLElement>('[data-switch]')
    expect(a?.getAttribute('role')).toBe('switch')
    expect(b?.getAttribute('role')).toBe('switch')
    click(a as HTMLElement)
    expect(a?.getAttribute('aria-checked')).toBe('true')
    expect(b?.getAttribute('aria-checked')).toBe('false')
  })
})

describe('APG switch — root as control fallback', () => {
  it('root element itself becomes the switch when no [data-switch] children exist', () => {
    const el = mount('<button>Toggle me</button>')
    attach(el)
    expect(el.getAttribute('role')).toBe('switch')
    expect(el.getAttribute('aria-checked')).toBe('false')
    click(el)
    expect(el.getAttribute('aria-checked')).toBe('true')
  })
})
