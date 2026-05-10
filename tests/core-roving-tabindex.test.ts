// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach } from 'vitest'
import { createRovingTabindex } from '../src/core/roving-tabindex.js'
import { createEl, cleanup, press } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

function buildRow(count: number): { root: HTMLElement; buttons: HTMLElement[] } {
  const inner = Array.from({ length: count }, (_, i) => `<button>Item ${String(i)}</button>`).join('')
  const root = mount(`<div>${inner}</div>`)
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('button'))
  return { root, buttons }
}

describe('createRovingTabindex — initialization', () => {
  it('sets tabindex=0 on first item and -1 on all others', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    expect(buttons[1].getAttribute('tabindex')).toBe('-1')
    expect(buttons[2].getAttribute('tabindex')).toBe('-1')
    rt.dispose()
  })

  it('getItems() returns the live result of the factory function provided at creation', () => {
    const { buttons } = buildRow(2)
    const rt = createRovingTabindex(() => buttons)
    expect(rt.getItems()).toBe(buttons)
    rt.dispose()
  })

  it('empty item list does not throw on creation or dispose', () => {
    expect(() => {
      createRovingTabindex(() => []).dispose()
    }).not.toThrow()
  })
})

describe('createRovingTabindex — focus()', () => {
  it('focus(n) moves tabindex=0 to the item at index n', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.focus(2)
    expect(buttons[0].getAttribute('tabindex')).toBe('-1')
    expect(buttons[1].getAttribute('tabindex')).toBe('-1')
    expect(buttons[2].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('focus() clamps an index above the last to the last item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.focus(99)
    expect(buttons[2].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('focus() clamps a negative index to the first item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.focus(-5)
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('focusCurrent() restores DOM focus to the internally tracked current item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.focus(2)
    buttons[0].focus()
    rt.focusCurrent()
    expect(document.activeElement).toBe(buttons[2])
    expect(buttons[2].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })
})

describe('createRovingTabindex — keyboard navigation, orientation=both (default)', () => {
  it('ArrowDown moves to the next item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    press(buttons[0], 'ArrowDown')
    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('ArrowUp moves to the previous item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.focus(2)
    press(buttons[2], 'ArrowUp')
    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('ArrowRight moves to the next item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    press(buttons[0], 'ArrowRight')
    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('ArrowLeft moves to the previous item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.focus(2)
    press(buttons[2], 'ArrowLeft')
    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('Home moves to the first item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.focus(2)
    press(buttons[2], 'Home')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('End moves to the last item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    press(buttons[0], 'End')
    expect(buttons[2].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('unrelated key causes no focus movement', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    press(buttons[0], 'Tab')
    press(buttons[0], 'Enter')
    press(buttons[0], 'a')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('event from a non-member element causes no focus movement', () => {
    const { root, buttons } = buildRow(3)
    const outsider = document.createElement('button')
    root.appendChild(outsider)
    const rt = createRovingTabindex(() => buttons)
    press(outsider, 'ArrowDown')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('keydown when getItems() dynamically returns empty does not throw', () => {
    const { buttons } = buildRow(2)
    let items = buttons.slice()
    const rt = createRovingTabindex(() => items)
    items = []
    expect(() => { press(buttons[0], 'ArrowDown') }).not.toThrow()
    rt.dispose()
  })
})

describe('createRovingTabindex — wrap', () => {
  it('wrap=true: ArrowDown from the last item wraps to the first', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { wrap: true })
    rt.focus(2)
    press(buttons[2], 'ArrowDown')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('wrap=true: ArrowUp from the first item wraps to the last', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { wrap: true })
    press(buttons[0], 'ArrowUp')
    expect(buttons[2].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('wrap=false: ArrowDown at the last item stays at the last', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { wrap: false })
    rt.focus(2)
    press(buttons[2], 'ArrowDown')
    expect(buttons[2].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('wrap=false: ArrowUp at the first item stays at the first', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { wrap: false })
    press(buttons[0], 'ArrowUp')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('single-item list: ArrowDown stays at the only item regardless of wrap', () => {
    const { buttons } = buildRow(1)
    const rt = createRovingTabindex(() => buttons, { wrap: true })
    press(buttons[0], 'ArrowDown')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('single-item list: ArrowUp stays at the only item regardless of wrap', () => {
    const { buttons } = buildRow(1)
    const rt = createRovingTabindex(() => buttons, { wrap: true })
    press(buttons[0], 'ArrowUp')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })
})

describe('createRovingTabindex — orientation', () => {
  it('horizontal: ArrowRight moves to the next item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { orientation: 'horizontal' })
    press(buttons[0], 'ArrowRight')
    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('horizontal: ArrowLeft moves to the previous item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { orientation: 'horizontal' })
    rt.focus(2)
    press(buttons[2], 'ArrowLeft')
    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('horizontal: ArrowDown is ignored', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { orientation: 'horizontal' })
    press(buttons[0], 'ArrowDown')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('horizontal: ArrowUp is ignored', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { orientation: 'horizontal' })
    press(buttons[0], 'ArrowUp')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('vertical: ArrowDown moves to the next item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { orientation: 'vertical' })
    press(buttons[0], 'ArrowDown')
    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('vertical: ArrowUp moves to the previous item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { orientation: 'vertical' })
    rt.focus(2)
    press(buttons[2], 'ArrowUp')
    expect(buttons[1].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('vertical: ArrowRight is ignored', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { orientation: 'vertical' })
    press(buttons[0], 'ArrowRight')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('vertical: ArrowLeft is ignored', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons, { orientation: 'vertical' })
    press(buttons[0], 'ArrowLeft')
    expect(buttons[0].getAttribute('tabindex')).toBe('0')
    rt.dispose()
  })

  it('Home and End work regardless of orientation setting', () => {
    const { buttons: hButtons } = buildRow(3)
    const hRt = createRovingTabindex(() => hButtons, { orientation: 'horizontal' })
    hRt.focus(2)
    press(hButtons[2], 'Home')
    expect(hButtons[0].getAttribute('tabindex')).toBe('0')
    hRt.dispose()

    const { buttons: vButtons } = buildRow(3)
    const vRt = createRovingTabindex(() => vButtons, { orientation: 'vertical' })
    press(vButtons[0], 'End')
    expect(vButtons[2].getAttribute('tabindex')).toBe('0')
    vRt.dispose()
  })
})

describe('createRovingTabindex — onActivate callback', () => {
  it('fires with the newly focused item and its index on keyboard movement', () => {
    const { buttons } = buildRow(3)
    const calls: Array<{ item: HTMLElement; index: number }> = []
    const rt = createRovingTabindex(() => buttons, {
      onActivate: (item, index) => { calls.push({ item, index }) },
    })
    press(buttons[0], 'ArrowDown')
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual({ item: buttons[1], index: 1 })
    rt.dispose()
  })

  it('fires with the target item and its index when focus(n) is called directly', () => {
    const { buttons } = buildRow(3)
    const indices: number[] = []
    const rt = createRovingTabindex(() => buttons, {
      onActivate: (_, index) => { indices.push(index) },
    })
    rt.focus(2)
    expect(indices).toEqual([2])
    rt.dispose()
  })
})

describe('createRovingTabindex — dispose', () => {
  it('removes all tabindex attributes from every item', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.dispose()
    buttons.forEach((btn) => { expect(btn.getAttribute('tabindex')).toBeNull() })
  })

  it('removes keydown listeners so navigation no longer moves focus', () => {
    const { buttons } = buildRow(3)
    const rt = createRovingTabindex(() => buttons)
    rt.dispose()
    press(buttons[0], 'ArrowDown')
    expect(buttons[1].getAttribute('tabindex')).toBeNull()
  })
})
