// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach } from 'vitest'
import { attach } from '../src/accordion/accordion.js'
import { createEl, cleanup, press, click } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

function buildAccordion(multiple = false): { root: HTMLElement; t1: HTMLElement; t2: HTMLElement; p1: HTMLElement; p2: HTMLElement; multiple: boolean } {
  const root = mount(`
    <div>
      <div data-accordion-item>
        <button data-accordion-trigger aria-expanded="true">Item 1</button>
        <div data-accordion-panel>Panel 1</div>
      </div>
      <div data-accordion-item>
        <button data-accordion-trigger>Item 2</button>
        <div data-accordion-panel hidden>Panel 2</div>
      </div>
    </div>`)
  const [t1, t2] = root.querySelectorAll<HTMLElement>('[data-accordion-trigger]')
  const [p1, p2] = root.querySelectorAll<HTMLElement>('[data-accordion-panel]')
  return { root, t1: t1 as HTMLElement, t2: t2 as HTMLElement, p1: p1 as HTMLElement, p2: p2 as HTMLElement, multiple }
}

describe('APG accordion', () => {
  it('sets aria-expanded on triggers', () => {
    const { root, t1, t2, multiple } = buildAccordion()
    attach(root, { multiple })
    expect(t1.getAttribute('aria-expanded')).toBe('true')
    expect(t2.getAttribute('aria-expanded')).toBe('false')
  })

  it('links trigger to panel via aria-controls + role=region', () => {
    const { root, t1, p1 } = buildAccordion()
    attach(root)
    expect(t1.getAttribute('aria-controls')).toBe(p1.id)
    expect(p1.getAttribute('role')).toBe('region')
    expect(p1.getAttribute('aria-labelledby')).toBe(t1.id)
  })

  it('toggles panel on click', () => {
    const { root, t2, p2 } = buildAccordion()
    attach(root)
    click(t2)
    expect(t2.getAttribute('aria-expanded')).toBe('true')
    expect(p2.hasAttribute('hidden')).toBe(false)
  })

  it('collapses previously open panel in single mode', () => {
    const { root, t1, t2, p1 } = buildAccordion(false)
    attach(root)
    click(t2)
    expect(t1.getAttribute('aria-expanded')).toBe('false')
    expect(p1.hasAttribute('hidden')).toBe(true)
  })

  it('allows multiple open in multiple mode', () => {
    const { root, t1, t2, multiple } = buildAccordion(true)
    attach(root, { multiple })
    click(t2)
    expect(t1.getAttribute('aria-expanded')).toBe('true')
    expect(t2.getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowDown moves focus to next trigger', () => {
    const { root, t1, t2 } = buildAccordion()
    attach(root)
    t1.focus()
    press(t1, 'ArrowDown')
    expect(document.activeElement).toBe(t2)
  })

  it('ArrowDown wraps from last trigger to first', () => {
    const { root, t1, t2 } = buildAccordion()
    attach(root)
    t2.focus()
    press(t2, 'ArrowDown')
    expect(document.activeElement).toBe(t1)
  })

  it('ArrowUp moves focus to previous trigger', () => {
    const { root, t1, t2 } = buildAccordion()
    attach(root)
    t2.focus()
    press(t2, 'ArrowUp')
    expect(document.activeElement).toBe(t1)
  })

  it('ArrowUp wraps from first trigger to last', () => {
    const { root, t1, t2 } = buildAccordion()
    attach(root)
    t1.focus()
    press(t1, 'ArrowUp')
    expect(document.activeElement).toBe(t2)
  })

  it('Home focuses first trigger', () => {
    const { root, t1, t2 } = buildAccordion()
    attach(root)
    t2.focus()
    press(t2, 'Home')
    expect(document.activeElement).toBe(t1)
  })

  it('End focuses last trigger', () => {
    const { root, t1, t2 } = buildAccordion()
    attach(root)
    t1.focus()
    press(t1, 'End')
    expect(document.activeElement).toBe(t2)
  })
})
