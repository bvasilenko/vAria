// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach } from 'vitest'
import { onKey, onKeyPreventDefault } from '../src/core/key-dispatch.js'
import { createEl, cleanup, press } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

describe('onKey', () => {
  it('invokes the handler for its registered key', () => {
    const target = mount('<div tabindex="0"></div>')
    let count = 0
    const { dispose } = onKey(target, { Enter: () => { count++ } })
    press(target, 'Enter')
    expect(count).toBe(1)
    dispose()
  })

  it('ignores keys absent from the keymap', () => {
    const target = mount('<div tabindex="0"></div>')
    let count = 0
    const { dispose } = onKey(target, { Enter: () => { count++ } })
    press(target, 'Escape')
    press(target, ' ')
    press(target, 'ArrowDown')
    expect(count).toBe(0)
    dispose()
  })

  it('dispatches each key to its own handler independently', () => {
    const target = mount('<div tabindex="0"></div>')
    let enters = 0
    let escapes = 0
    const { dispose } = onKey(target, {
      Enter: () => { enters++ },
      Escape: () => { escapes++ },
    })
    press(target, 'Enter')
    press(target, 'Escape')
    press(target, 'Enter')
    expect(enters).toBe(2)
    expect(escapes).toBe(1)
    dispose()
  })

  it('stops dispatching after dispose', () => {
    const target = mount('<div tabindex="0"></div>')
    let count = 0
    const { dispose } = onKey(target, { Enter: () => { count++ } })
    press(target, 'Enter')
    dispose()
    press(target, 'Enter')
    expect(count).toBe(1)
  })

  it('two independent listeners on the same target dispose without affecting each other', () => {
    const target = mount('<div tabindex="0"></div>')
    let a = 0
    let b = 0
    const first = onKey(target, { Enter: () => { a++ } })
    const second = onKey(target, { Enter: () => { b++ } })
    press(target, 'Enter')
    expect(a).toBe(1)
    expect(b).toBe(1)
    first.dispose()
    press(target, 'Enter')
    expect(a).toBe(1)
    expect(b).toBe(2)
    second.dispose()
  })

  it('registers in capture phase when capture:true is set', () => {
    const parent = mount('<div><button>B</button></div>')
    const child = parent.querySelector('button') as HTMLElement
    let count = 0
    const { dispose } = onKey(parent, { Enter: () => { count++ } }, { capture: true })
    press(child, 'Enter')
    expect(count).toBe(1)
    dispose()
  })
})

describe('onKeyPreventDefault', () => {
  it('calls preventDefault on the matched key', () => {
    const target = mount('<div tabindex="0"></div>')
    let prevented = false
    const { dispose } = onKeyPreventDefault(target, { ArrowDown: () => {} })
    target.addEventListener('keydown', (e) => { if (e.defaultPrevented) prevented = true })
    press(target, 'ArrowDown')
    expect(prevented).toBe(true)
    dispose()
  })

  it('does not call preventDefault for an unmatched key', () => {
    const target = mount('<div tabindex="0"></div>')
    let prevented = false
    const { dispose } = onKeyPreventDefault(target, { ArrowDown: () => {} })
    target.addEventListener('keydown', (e) => { if (e.defaultPrevented) prevented = true })
    press(target, 'Enter')
    expect(prevented).toBe(false)
    dispose()
  })

  it('still invokes the handler alongside preventDefault', () => {
    const target = mount('<div tabindex="0"></div>')
    let count = 0
    const { dispose } = onKeyPreventDefault(target, { Enter: () => { count++ } })
    press(target, 'Enter')
    expect(count).toBe(1)
    dispose()
  })

  it('stops dispatching after dispose', () => {
    const target = mount('<div tabindex="0"></div>')
    let count = 0
    const { dispose } = onKeyPreventDefault(target, { Enter: () => { count++ } })
    press(target, 'Enter')
    dispose()
    press(target, 'Enter')
    expect(count).toBe(1)
  })
})
