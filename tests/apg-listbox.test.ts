// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach } from 'vitest'
import { attach } from '../src/listbox/listbox.js'
import { createEl, cleanup, press, click } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

function buildListbox(multi = false): { root: HTMLElement; options: HTMLElement[]; multi: boolean } {
  const root = mount(`
    <div>
      <div data-option data-value="a">Alpha</div>
      <div data-option data-value="b">Beta</div>
      <div data-option data-value="c">Gamma</div>
    </div>`)
  const options = Array.from(root.querySelectorAll<HTMLElement>('[data-option]'))
  return { root, options, multi }
}

describe('APG listbox', () => {
  it('sets role=listbox', () => {
    const { root } = buildListbox()
    attach(root)
    expect(root.getAttribute('role')).toBe('listbox')
  })

  it('sets role=option on each item', () => {
    const { root, options } = buildListbox()
    attach(root)
    options.forEach((opt) => { expect(opt.getAttribute('role')).toBe('option') })
  })

  it('sets tabindex=0 on listbox for keyboard access', () => {
    const { root } = buildListbox()
    attach(root)
    expect(root.getAttribute('tabindex')).toBe('0')
  })

  it('aria-multiselectable=false by default', () => {
    const { root } = buildListbox(false)
    attach(root)
    expect(root.getAttribute('aria-multiselectable')).toBe('false')
  })

  it('aria-multiselectable=true when specified', () => {
    const { root, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    expect(root.getAttribute('aria-multiselectable')).toBe('true')
  })

  it('sets aria-activedescendant to first option on attach', () => {
    const { root, options } = buildListbox()
    attach(root)
    expect(root.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
  })

  it('ArrowDown moves activedescendant to next option and selects in single mode', () => {
    const { root, options, multi } = buildListbox(false)
    attach(root, { multiselect: multi })
    press(root, 'ArrowDown')
    expect(root.getAttribute('aria-activedescendant')).toBe(options[1]?.id)
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options[0]?.getAttribute('aria-selected')).toBe('false')
  })

  it('ArrowUp moves activedescendant to previous option', () => {
    const { root, options } = buildListbox()
    attach(root)
    press(root, 'ArrowDown')
    press(root, 'ArrowUp')
    expect(root.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
    expect(options[1]?.getAttribute('aria-selected')).toBe('false')
  })

  it('ArrowDown stays at last option when already at end', () => {
    const { root, options } = buildListbox()
    attach(root)
    press(root, 'End')
    press(root, 'ArrowDown')
    expect(root.getAttribute('aria-activedescendant')).toBe(options[2]?.id)
  })

  it('ArrowUp stays at first option when already at start', () => {
    const { root, options } = buildListbox()
    attach(root)
    press(root, 'ArrowUp')
    expect(root.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
  })

  it('Home moves to first option', () => {
    const { root, options } = buildListbox()
    attach(root)
    press(root, 'ArrowDown')
    press(root, 'ArrowDown')
    press(root, 'Home')
    expect(root.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
  })

  it('End moves to last option', () => {
    const { root, options } = buildListbox()
    attach(root)
    press(root, 'End')
    expect(root.getAttribute('aria-activedescendant')).toBe(options[2]?.id)
  })

  it('click selects option and sets activedescendant in single mode', () => {
    const { root, options } = buildListbox()
    attach(root)
    click(options[1] as HTMLElement)
    expect(root.getAttribute('aria-activedescendant')).toBe(options[1]?.id)
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options[0]?.getAttribute('aria-selected')).toBe('false')
    expect(options[2]?.getAttribute('aria-selected')).toBe('false')
  })

  it('typeahead activates and selects matching option in single mode', () => {
    const { root, options } = buildListbox()
    attach(root)
    press(root, 'b')
    expect(root.getAttribute('aria-activedescendant')).toBe(options[1]?.id)
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
  })

  it('multiselect: Space toggles selection without moving active', () => {
    const { root, options, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    press(root, 'ArrowDown')
    press(root, ' ')
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    press(root, ' ')
    expect(options[1]?.getAttribute('aria-selected')).toBe('false')
  })

  it('multiselect: Shift+ArrowDown extends range', () => {
    const { root, options, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    press(root, 'ArrowDown', { shiftKey: true })
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
  })

  it('multiselect: Shift+ArrowUp selects range from anchor to previous', () => {
    const { root, options, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    press(root, 'ArrowDown')
    press(root, 'ArrowDown')
    press(root, 'ArrowUp', { shiftKey: true })
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options[2]?.getAttribute('aria-selected')).toBe('false')
  })
})
