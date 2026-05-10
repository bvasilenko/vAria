// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, vi } from 'vitest'
import { attach } from '../src/listbox/listbox.js'
import { useMountFixture, press, click } from './helpers.js'

const mount = useMountFixture()

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

describe('APG listbox — aria-multiselectable from DOM attribute', () => {
  it('picks up aria-multiselectable=true from the element attribute without options', () => {
    const wrapper = mount('<div><div aria-multiselectable="true"><div data-option>A</div></div></div>')
    const root = wrapper.querySelector<HTMLElement>('[aria-multiselectable]') as HTMLElement
    const opt = root.querySelector<HTMLElement>('[data-option]') as HTMLElement
    attach(root)
    expect(root.getAttribute('aria-multiselectable')).toBe('true')
    press(root, ' ')
    expect(opt.getAttribute('aria-selected')).toBe('true')
  })
})

describe('APG listbox — multiselect Shift+Home and Shift+End', () => {
  it('Shift+Home selects from rangeAnchor (set by click) back to first option', () => {
    const { root, options, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    click(options[2] as HTMLElement)
    press(root, 'Home', { shiftKey: true })
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options[2]?.getAttribute('aria-selected')).toBe('true')
  })

  it('Shift+End selects from rangeAnchor (set by click) forward to last option', () => {
    const { root, options, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    click(options[1] as HTMLElement)
    press(root, 'End', { shiftKey: true })
    expect(options[0]?.getAttribute('aria-selected')).toBe('false')
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options[2]?.getAttribute('aria-selected')).toBe('true')
  })
})

describe('APG listbox — multiselect click modifiers', () => {
  it('Ctrl+click toggles an individual option without affecting others', () => {
    const { root, options, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    options[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
    expect(options[1]?.getAttribute('aria-selected')).toBe('false')
    options[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
    expect(options[0]?.getAttribute('aria-selected')).toBe('false')
  })

  it('Meta+click toggles an individual option (macOS equivalent of Ctrl+click)', () => {
    const { root, options, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    options[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }))
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options[0]?.getAttribute('aria-selected')).toBe('false')
  })

  it('Shift+click selects range from rangeAnchor to clicked option', () => {
    const { root, options, multi } = buildListbox(true)
    attach(root, { multiselect: multi })
    click(options[0] as HTMLElement)
    options[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options[2]?.getAttribute('aria-selected')).toBe('true')
  })
})

describe('APG listbox — onSelect callback', () => {
  it('onSelect fires with current selected values on ArrowDown', () => {
    const { root, options } = buildListbox(false)
    const onSelect = vi.fn()
    attach(root, { onSelect })
    press(root, 'ArrowDown')
    expect(onSelect).toHaveBeenCalledWith(
      [options[1]?.getAttribute('data-value')],
      [options[1]],
    )
  })

  it('onSelect fires with all selected values in multiselect mode', () => {
    const { root, options, multi } = buildListbox(true)
    const onSelect = vi.fn()
    attach(root, { multiselect: multi, onSelect })
    press(root, 'ArrowDown', { shiftKey: true })
    const vals = onSelect.mock.calls[0]?.[0] as string[]
    expect(vals.length).toBe(2)
    expect(vals).toContain(options[0]?.getAttribute('data-value'))
    expect(vals).toContain(options[1]?.getAttribute('data-value'))
  })
})

describe('APG listbox — Space key in single-select mode', () => {
  it('Space selects the currently active option in single-select mode', () => {
    const { root, options } = buildListbox(false)
    attach(root, { multiselect: false })
    press(root, 'ArrowDown')
    press(root, ' ')
    expect(options[1]?.getAttribute('aria-selected')).toBe('true')
    expect(options[0]?.getAttribute('aria-selected')).toBe('false')
  })
})

describe('APG listbox — click on container area (not on option)', () => {
  it('click on root element itself does not throw and leaves selection unchanged', () => {
    const { root, options } = buildListbox(false)
    attach(root)
    click(options[0] as HTMLElement)
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
    root.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(options[0]?.getAttribute('aria-selected')).toBe('true')
  })
})

describe('APG listbox — click on a disabled option is ignored', () => {
  it('clicking an aria-disabled option does not move activedescendant', () => {
    const root = mount(`
      <div>
        <div data-option data-value="a">Alpha</div>
        <div data-option data-value="b" aria-disabled="true">Beta (disabled)</div>
      </div>`)
    const options = Array.from(root.querySelectorAll<HTMLElement>('[data-option]'))
    attach(root)
    click(options[1] as HTMLElement)
    expect(root.getAttribute('aria-activedescendant')).toBe(options[0]?.id)
  })
})

describe('APG listbox — toggleSelect with out-of-range index', () => {
  it('Space on listbox with all options disabled does not throw', () => {
    const root = mount(`
      <div>
        <div data-option aria-disabled="true">Alpha</div>
        <div data-option aria-disabled="true">Beta</div>
      </div>`)
    attach(root, { multiselect: true })
    expect(() => { press(root, ' ') }).not.toThrow()
  })
})
