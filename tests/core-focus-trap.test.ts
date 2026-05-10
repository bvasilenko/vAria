// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, vi } from 'vitest'
import { getFocusableElements, createFocusTrap } from '../src/core/focus-trap.js'
import { useMountFixture, press } from './helpers.js'

const mount = useMountFixture()

describe('getFocusableElements — included element types', () => {
  it('includes <a href>', () => {
    const root = mount('<div><a href="#">link</a></div>')
    expect(getFocusableElements(root).map((e) => e.tagName)).toContain('A')
  })

  it('includes <button> not disabled', () => {
    const root = mount('<div><button>btn</button></div>')
    expect(getFocusableElements(root).length).toBe(1)
  })

  it('includes <input> not disabled and not hidden type', () => {
    const root = mount('<div><input type="text"></div>')
    expect(getFocusableElements(root).length).toBe(1)
  })

  it('includes <select> not disabled', () => {
    const root = mount('<div><select><option>A</option></select></div>')
    expect(getFocusableElements(root).length).toBe(1)
  })

  it('includes <textarea> not disabled', () => {
    const root = mount('<div><textarea></textarea></div>')
    expect(getFocusableElements(root).length).toBe(1)
  })

  it('includes element with tabindex >= 0', () => {
    const root = mount('<div><span tabindex="0">x</span></div>')
    expect(getFocusableElements(root).length).toBe(1)
  })

  it('includes [contenteditable="true"]', () => {
    const root = mount('<div><div contenteditable="true">x</div></div>')
    expect(getFocusableElements(root).length).toBe(1)
  })
})

describe('getFocusableElements — excluded element types', () => {
  it('excludes <button disabled>', () => {
    const root = mount('<div><button disabled>x</button></div>')
    expect(getFocusableElements(root).length).toBe(0)
  })

  it('excludes <input disabled>', () => {
    const root = mount('<div><input disabled></div>')
    expect(getFocusableElements(root).length).toBe(0)
  })

  it('excludes <input type="hidden">', () => {
    const root = mount('<div><input type="hidden"></div>')
    expect(getFocusableElements(root).length).toBe(0)
  })

  it('excludes [tabindex="-1"]', () => {
    const root = mount('<div><span tabindex="-1">x</span></div>')
    expect(getFocusableElements(root).length).toBe(0)
  })

  it('excludes focusable elements inside [hidden]', () => {
    const root = mount('<div><div hidden><button>x</button></div></div>')
    expect(getFocusableElements(root).length).toBe(0)
  })

  it('excludes focusable elements inside [aria-hidden="true"]', () => {
    const root = mount('<div><div aria-hidden="true"><button>x</button></div></div>')
    expect(getFocusableElements(root).length).toBe(0)
  })

  it('returns empty array when container has no focusable descendants', () => {
    const root = mount('<div><span>text</span></div>')
    expect(getFocusableElements(root).length).toBe(0)
  })
})

describe('getFocusableElements — order', () => {
  it('returns elements in DOM order', () => {
    const root = mount('<div><button id="a">A</button><button id="b">B</button></div>')
    const ids = getFocusableElements(root).map((e) => e.id)
    expect(ids).toEqual(['a', 'b'])
  })
})

describe('createFocusTrap — Tab wraps at boundary', () => {
  it('Tab from last focusable wraps focus to first', () => {
    const root = mount('<div><button id="f">First</button><button id="l">Last</button></div>')
    const [first, last] = Array.from(root.querySelectorAll<HTMLElement>('button'))
    const trap = createFocusTrap(root)
    trap.activate()
    last?.focus()
    const spy = vi.spyOn(first as HTMLElement, 'focus')
    press(root, 'Tab')
    expect(spy).toHaveBeenCalled()
  })

  it('Shift+Tab from first focusable wraps focus to last', () => {
    const root = mount('<div><button id="f">First</button><button id="l">Last</button></div>')
    const [first, last] = Array.from(root.querySelectorAll<HTMLElement>('button'))
    const trap = createFocusTrap(root)
    trap.activate()
    first?.focus()
    const spy = vi.spyOn(last as HTMLElement, 'focus')
    press(root, 'Tab', { shiftKey: true })
    expect(spy).toHaveBeenCalled()
  })
})

describe('createFocusTrap — Tab does not wrap within boundary', () => {
  it('Tab from a non-last element does not call focus on last', () => {
    const root = mount('<div><button id="a">A</button><button id="b">B</button><button id="c">C</button></div>')
    const [a, , c] = Array.from(root.querySelectorAll<HTMLElement>('button'))
    const trap = createFocusTrap(root)
    trap.activate()
    a?.focus()
    const spy = vi.spyOn(c as HTMLElement, 'focus')
    press(root, 'Tab')
    expect(spy).not.toHaveBeenCalled()
  })

  it('Shift+Tab from a non-first element does not call focus on first', () => {
    const root = mount('<div><button id="a">A</button><button id="b">B</button><button id="c">C</button></div>')
    const [a, b] = Array.from(root.querySelectorAll<HTMLElement>('button'))
    const trap = createFocusTrap(root)
    trap.activate()
    b?.focus()
    const spy = vi.spyOn(a as HTMLElement, 'focus')
    press(root, 'Tab', { shiftKey: true })
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('createFocusTrap — zero focusable elements', () => {
  it('Tab is prevented when container has no focusable children', () => {
    const root = mount('<div><span>no focusable</span></div>')
    const trap = createFocusTrap(root)
    trap.activate()
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    root.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })
})

describe('createFocusTrap — non-Tab keys', () => {
  it('non-Tab key does not alter focus', () => {
    const root = mount('<div><button>A</button></div>')
    const btn = root.querySelector<HTMLElement>('button') as HTMLElement
    const trap = createFocusTrap(root)
    trap.activate()
    const spy = vi.spyOn(btn, 'focus')
    press(root, 'Enter')
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('createFocusTrap — lifecycle', () => {
  it('deactivate removes listener so Tab no longer wraps', () => {
    const root = mount('<div><button id="f">F</button><button id="l">L</button></div>')
    const [, last] = Array.from(root.querySelectorAll<HTMLElement>('button'))
    const trap = createFocusTrap(root)
    trap.activate()
    trap.deactivate()
    last?.focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    root.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('re-activate after deactivate restores wrapping', () => {
    const root = mount('<div><button id="f">F</button><button id="l">L</button></div>')
    const [first, last] = Array.from(root.querySelectorAll<HTMLElement>('button'))
    const trap = createFocusTrap(root)
    trap.activate()
    trap.deactivate()
    trap.activate()
    last?.focus()
    const spy = vi.spyOn(first as HTMLElement, 'focus')
    press(root, 'Tab')
    expect(spy).toHaveBeenCalled()
  })
})
