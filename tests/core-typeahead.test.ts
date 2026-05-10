// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createTypeahead } from '../src/core/typeahead.js'
import { useMountFixture } from './helpers.js'

const mount = useMountFixture()

function makeItems(labels: string[]): HTMLElement[] {
  const root = mount(`<ul>${labels.map((l) => `<li>${l}</li>`).join('')}</ul>`)
  return Array.from(root.querySelectorAll<HTMLElement>('li'))
}

describe('createTypeahead — key classification', () => {
  it('returns false for multi-character key names (Enter, ArrowDown, etc.)', () => {
    const ta = createTypeahead({ getItems: () => [], onMatch: vi.fn() })
    expect(ta.handleKey('Enter')).toBe(false)
    expect(ta.handleKey('ArrowDown')).toBe(false)
    expect(ta.handleKey('Escape')).toBe(false)
    expect(ta.handleKey('Tab')).toBe(false)
    expect(ta.handleKey('Backspace')).toBe(false)
  })

  it('returns false when no item matches the typed character', () => {
    const items = makeItems(['Alpha', 'Beta'])
    const ta = createTypeahead({ getItems: () => items, onMatch: vi.fn() })
    expect(ta.handleKey('z')).toBe(false)
  })

  it('returns true when an item matches the typed character', () => {
    const items = makeItems(['Alpha', 'Beta'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    expect(ta.handleKey('a')).toBe(true)
    expect(onMatch).toHaveBeenCalledWith(items[0], 0)
  })
})

describe('createTypeahead — case insensitivity', () => {
  it('matches uppercase input against lowercase label', () => {
    const items = makeItems(['apple', 'banana'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    ta.handleKey('A')
    expect(onMatch).toHaveBeenCalledWith(items[0], 0)
  })

  it('matches lowercase input against uppercase label', () => {
    const items = makeItems(['APPLE', 'BANANA'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    ta.handleKey('a')
    expect(onMatch).toHaveBeenCalledWith(items[0], 0)
  })
})

describe('createTypeahead — prefix buffer accumulation', () => {
  it('narrows match with successive keystrokes', () => {
    const items = makeItems(['Apple', 'Avocado', 'Banana'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    ta.handleKey('a')
    ta.handleKey('v')
    expect(onMatch).toHaveBeenLastCalledWith(items[1], 1)
  })

  it('matches first item when multiple share the prefix', () => {
    const items = makeItems(['Apple', 'Apricot', 'Banana'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    ta.handleKey('a')
    expect(onMatch).toHaveBeenCalledWith(items[0], 0)
  })

  it('returns false when accumulated buffer matches nothing', () => {
    const items = makeItems(['Apple', 'Banana'])
    const ta = createTypeahead({ getItems: () => items, onMatch: vi.fn() })
    ta.handleKey('a')
    expect(ta.handleKey('z')).toBe(false)
  })
})

describe('createTypeahead — debounce reset', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('buffer resets after 500 ms so next key starts a fresh match', () => {
    const items = makeItems(['Apple', 'Avocado'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    ta.handleKey('a')
    ta.handleKey('v')
    expect(onMatch).toHaveBeenLastCalledWith(items[1], 1)
    vi.advanceTimersByTime(500)
    ta.handleKey('a')
    expect(onMatch).toHaveBeenLastCalledWith(items[0], 0)
  })

  it('second keystroke before 500 ms clears the previous timer and restarts it', () => {
    const items = makeItems(['Apple', 'Avocado', 'Banana'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    ta.handleKey('a')
    vi.advanceTimersByTime(300)
    ta.handleKey('v')
    vi.advanceTimersByTime(300)
    ta.handleKey('o')
    expect(onMatch).toHaveBeenLastCalledWith(items[1], 1)
  })

  it('buffer is clear after timer fires so new key starts fresh search', () => {
    const items = makeItems(['Apple', 'Avocado'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    ta.handleKey('a')
    vi.advanceTimersByTime(500)
    ta.handleKey('a')
    expect(onMatch).toHaveBeenLastCalledWith(items[0], 0)
  })
})

describe('createTypeahead — reset()', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('reset() clears buffer immediately so next key starts fresh', () => {
    const items = makeItems(['Apple', 'Avocado'])
    const onMatch = vi.fn()
    const ta = createTypeahead({ getItems: () => items, onMatch })
    ta.handleKey('a')
    ta.handleKey('v')
    ta.reset()
    ta.handleKey('a')
    expect(onMatch).toHaveBeenLastCalledWith(items[0], 0)
  })

  it('reset() cancels pending timer', () => {
    const items = makeItems(['Apple', 'Avocado'])
    const ta = createTypeahead({ getItems: () => items, onMatch: vi.fn() })
    ta.handleKey('a')
    ta.reset()
    vi.advanceTimersByTime(600)
  })
})
