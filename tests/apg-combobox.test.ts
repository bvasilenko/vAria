// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach } from 'vitest'
import { attach } from '../src/combobox/combobox.js'
import { createEl, cleanup, press, click } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

function buildCombobox(): { root: HTMLElement; input: HTMLInputElement; listbox: HTMLElement; options: HTMLElement[] } {
  const root = mount(`
    <div>
      <input type="text" placeholder="Pick one">
      <ul role="listbox" hidden>
        <li data-option data-value="Apple">Apple</li>
        <li data-option data-value="Banana">Banana</li>
        <li data-option data-value="Cherry">Cherry</li>
      </ul>
    </div>`)
  const input = root.querySelector<HTMLInputElement>('input') as HTMLInputElement
  const listbox = root.querySelector<HTMLElement>('[role="listbox"]') as HTMLElement
  const options = Array.from(root.querySelectorAll<HTMLElement>('[data-option]'))
  return { root, input, listbox, options }
}

describe('APG combobox', () => {
  it('sets role=combobox, aria-haspopup, aria-controls on input', () => {
    const { root, input, listbox } = buildCombobox()
    attach(root)
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-haspopup')).toBe('listbox')
    expect(input.getAttribute('aria-controls')).toBe(listbox.id)
  })

  it('sets role=option on each option', () => {
    const { root, options } = buildCombobox()
    attach(root)
    options.forEach((opt) => { expect(opt.getAttribute('role')).toBe('option') })
  })

  it('starts with aria-expanded=false', () => {
    const { root, input } = buildCombobox()
    attach(root)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens on focus', () => {
    const { root, input, listbox } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(listbox.hasAttribute('hidden')).toBe(false)
  })

  it('ArrowDown navigates to first option via aria-activedescendant', () => {
    const { root, input, options } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
  })

  it('ArrowDown navigates to second option', () => {
    const { root, input, options } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'ArrowDown')
    press(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1]?.id)
  })

  it('ArrowUp with no active option goes to last option', () => {
    const { root, input, options } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'ArrowUp')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[2]?.id)
  })

  it('ArrowDown wraps from last option to first', () => {
    const { root, input, options } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'ArrowDown')
    press(input, 'ArrowDown')
    press(input, 'ArrowDown')
    press(input, 'ArrowDown')
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
  })

  it('typing filters visible options to those matching input', () => {
    const { root, input, options } = buildCombobox()
    attach(root)
    input.value = 'an'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(options[0]?.hidden).toBe(true)
    expect(options[1]?.hidden).toBe(false)
    expect(options[2]?.hidden).toBe(true)
  })

  it('clicking option selects and collapses listbox', () => {
    const { root, input, listbox, options } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    click(options[1] as HTMLElement)
    expect(input.value).toBe('Banana')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(listbox.hasAttribute('hidden')).toBe(true)
  })

  it('Enter selects active option and collapses', () => {
    const { root, input, listbox } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'ArrowDown')
    press(input, 'Enter')
    expect(input.value).toBe('Apple')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(listbox.hasAttribute('hidden')).toBe(true)
  })

  it('Tab key closes list without selecting option', () => {
    const { root, input, listbox } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'ArrowDown')
    press(input, 'Tab')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(listbox.hasAttribute('hidden')).toBe(true)
    expect(input.value).toBe('')
  })

  it('Escape collapses without selecting', () => {
    const { root, input, listbox } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'ArrowDown')
    press(input, 'Escape')
    expect(input.value).toBe('')
    expect(listbox.hasAttribute('hidden')).toBe(true)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('aria-activedescendant is cleared when listbox collapses', () => {
    const { root, input } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'ArrowDown')
    expect(input.hasAttribute('aria-activedescendant')).toBe(true)
    press(input, 'Escape')
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
  })
})
