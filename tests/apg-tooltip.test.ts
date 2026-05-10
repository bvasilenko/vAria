// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { attach } from '../src/tooltip/tooltip.js'
import { createEl, cleanup, press } from './helpers.js'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

function buildTooltip(): { root: HTMLElement; trigger: HTMLElement; tip: HTMLElement } {
  const root = mount(`
    <div>
      <button data-tooltip-trigger>Hover me</button>
      <span data-tooltip-content>Tooltip text</span>
    </div>`)
  const trigger = root.querySelector<HTMLElement>('[data-tooltip-trigger]') as HTMLElement
  const tip = root.querySelector<HTMLElement>('[data-tooltip-content]') as HTMLElement
  return { root, trigger, tip }
}

describe('APG tooltip', () => {
  it('sets role=tooltip on tooltip element', () => {
    const { root, tip } = buildTooltip()
    attach(root)
    expect(tip.getAttribute('role')).toBe('tooltip')
  })

  it('sets aria-describedby on trigger pointing to tooltip id', () => {
    const { root, trigger, tip } = buildTooltip()
    attach(root)
    expect(trigger.getAttribute('aria-describedby')).toBe(tip.id)
    expect(tip.id).toBeTruthy()
  })

  it('starts with hidden attribute and data-state=hidden', () => {
    const { root, tip } = buildTooltip()
    attach(root)
    expect(tip.hasAttribute('hidden')).toBe(true)
    expect(tip.getAttribute('data-state')).toBe('hidden')
  })

  it('shows tooltip on mouseenter after delay', () => {
    const { root, trigger, tip } = buildTooltip()
    attach(root, { showDelay: 300 })
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    expect(tip.hasAttribute('hidden')).toBe(true)
    vi.advanceTimersByTime(300)
    expect(tip.hasAttribute('hidden')).toBe(false)
    expect(tip.getAttribute('data-state')).toBe('visible')
  })

  it('hides tooltip on mouseleave after delay', () => {
    const { root, trigger, tip } = buildTooltip()
    attach(root, { showDelay: 0, hideDelay: 100 })
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    vi.advanceTimersByTime(0)
    trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    expect(tip.hasAttribute('hidden')).toBe(false)
    vi.advanceTimersByTime(100)
    expect(tip.hasAttribute('hidden')).toBe(true)
  })

  it('mouseleave during show delay cancels pending show', () => {
    const { root, trigger, tip } = buildTooltip()
    attach(root, { showDelay: 300, hideDelay: 100 })
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    vi.advanceTimersByTime(150)
    trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    vi.advanceTimersByTime(300)
    expect(tip.hasAttribute('hidden')).toBe(true)
  })

  it('hides tooltip on Escape key', () => {
    const { root, trigger, tip } = buildTooltip()
    attach(root, { showDelay: 0 })
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    vi.advanceTimersByTime(0)
    press(trigger, 'Escape')
    vi.advanceTimersByTime(100)
    expect(tip.hasAttribute('hidden')).toBe(true)
  })

  it('shows tooltip on focus', () => {
    const { root, trigger, tip } = buildTooltip()
    attach(root, { showDelay: 0 })
    trigger.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    vi.advanceTimersByTime(0)
    expect(tip.hasAttribute('hidden')).toBe(false)
  })

  it('hides tooltip on blur', () => {
    const { root, trigger, tip } = buildTooltip()
    attach(root, { showDelay: 0, hideDelay: 0 })
    trigger.dispatchEvent(new FocusEvent('focus', { bubbles: true }))
    vi.advanceTimersByTime(0)
    trigger.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
    vi.advanceTimersByTime(0)
    expect(tip.hasAttribute('hidden')).toBe(true)
  })
})
