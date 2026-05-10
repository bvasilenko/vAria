// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, vi } from 'vitest'
import { attach } from '../src/combobox/combobox.js'
import { useMountFixture, press, click } from './helpers.js'

const mount = useMountFixture()

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

describe('APG combobox — guard: missing required elements', () => {
  it('attach returns a callable no-op when input is absent', () => {
    const root = mount('<div><ul role="listbox" hidden><li data-option>A</li></ul></div>')
    const dispose = attach(root)
    expect(() => { dispose() }).not.toThrow()
  })

  it('attach returns a callable no-op when listbox is absent', () => {
    const root = mount('<div><input type="text"></div>')
    const dispose = attach(root)
    expect(() => { dispose() }).not.toThrow()
  })
})

describe('APG combobox — ArrowDown/Up when listbox is closed', () => {
  it('ArrowDown opens the listbox when it is closed without a prior focus event', () => {
    const { root, input, listbox } = buildCombobox()
    attach(root)
    press(input, 'ArrowDown')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(listbox.hasAttribute('hidden')).toBe(false)
  })

  it('ArrowUp opens the listbox when it is closed without a prior focus event', () => {
    const { root, input, listbox } = buildCombobox()
    attach(root)
    press(input, 'ArrowUp')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(listbox.hasAttribute('hidden')).toBe(false)
  })
})

describe('APG combobox — Enter with no active option', () => {
  it('Enter does not select or close when no option is highlighted', () => {
    const { root, input, listbox } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(input, 'Enter')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(listbox.hasAttribute('hidden')).toBe(false)
    expect(input.value).toBe('')
  })
})

describe('APG combobox — onSelect callback', () => {
  it('onSelect fires with value and element when option is clicked', () => {
    const { root, input: inp, options } = buildCombobox()
    const onSelect = vi.fn()
    attach(root, { onSelect })
    inp.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    click(options[0] as HTMLElement)
    expect(onSelect).toHaveBeenCalledWith('Apple', options[0])
  })

  it('onSelect fires with value and element on Enter selection', () => {
    const { root, input: inp, options } = buildCombobox()
    const onSelect = vi.fn()
    attach(root, { onSelect })
    inp.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    press(inp, 'ArrowDown')
    press(inp, 'Enter')
    expect(onSelect).toHaveBeenCalledWith('Apple', options[0])
  })
})

describe('APG combobox — outside pointerdown closes listbox', () => {
  it('pointerdown outside root closes an open listbox', () => {
    const { root, input: inp, listbox } = buildCombobox()
    attach(root)
    inp.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    expect(listbox.hasAttribute('hidden')).toBe(false)
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(listbox.hasAttribute('hidden')).toBe(true)
  })

  it('pointerdown inside root does not close an open listbox', () => {
    const { root, input: inp, listbox } = buildCombobox()
    attach(root)
    inp.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    root.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(listbox.hasAttribute('hidden')).toBe(false)
  })
})

describe('APG combobox — autocomplete=none skips filtering', () => {
  it('typing does not hide options when autocomplete is none', () => {
    const { root, input: inp, options } = buildCombobox()
    attach(root, { autocomplete: 'none' })
    inp.value = 'an'
    inp.dispatchEvent(new Event('input', { bubbles: true }))
    options.forEach((opt) => { expect(opt.hidden).toBe(false) })
  })
})

describe('APG combobox — navigate with all options filtered out', () => {
  it('ArrowDown with zero visible options does not throw', () => {
    const { root, input: inp } = buildCombobox()
    attach(root, { autocomplete: 'list' })
    inp.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    inp.value = 'zzzz'
    inp.dispatchEvent(new Event('input', { bubbles: true }))
    expect(() => { press(inp, 'ArrowDown') }).not.toThrow()
  })
})

describe('APG combobox — option value falls back to textContent', () => {
  it('selects textContent as value when data-value attribute is absent', () => {
    const root = mount(`
      <div>
        <input type="text">
        <ul role="listbox" hidden>
          <li data-option>OnlyText</li>
        </ul>
      </div>`)
    const inp = root.querySelector<HTMLInputElement>('input') as HTMLInputElement
    const opt = root.querySelector<HTMLElement>('[data-option]') as HTMLElement
    attach(root)
    inp.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    click(opt)
    expect(inp.value).toBe('OnlyText')
  })
})

describe('APG combobox — suppressNextFocus after selection', () => {
  it('internal focus from selectOption is suppressed so listbox stays closed', () => {
    const { root, input, listbox, options } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    click(options[0] as HTMLElement)
    expect(listbox.hasAttribute('hidden')).toBe(true)
  })

  it('subsequent user-initiated focus reopens listbox normally after suppress is consumed', () => {
    const { root, input, listbox, options } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    click(options[0] as HTMLElement)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    expect(listbox.hasAttribute('hidden')).toBe(false)
  })
})

describe('APG combobox — onInput while listbox is open', () => {
  it('typing while listbox is already open filters options without closing and reopening', () => {
    const { root, input, listbox, options } = buildCombobox()
    attach(root)
    input.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    expect(listbox.hasAttribute('hidden')).toBe(false)
    input.value = 'an'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    expect(listbox.hasAttribute('hidden')).toBe(false)
    expect(options[1]?.hidden).toBe(false)
    expect(options[0]?.hidden).toBe(true)
  })
})
