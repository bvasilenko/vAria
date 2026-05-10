// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach } from 'vitest'
import { attach } from '../src/tabs/tabs.js'
import { createEl, cleanup, press, click } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

function buildTabs(): { root: HTMLElement; tabs: HTMLElement[]; panels: HTMLElement[] } {
  const root = mount(`
    <div>
      <div data-tablist>
        <button data-tab aria-selected="true">Tab A</button>
        <button data-tab>Tab B</button>
        <button data-tab>Tab C</button>
      </div>
      <div data-tabpanel>Panel A</div>
      <div data-tabpanel hidden>Panel B</div>
      <div data-tabpanel hidden>Panel C</div>
    </div>`)
  const tabs = Array.from(root.querySelectorAll<HTMLElement>('[data-tab]'))
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tabpanel]'))
  return { root, tabs, panels }
}

describe('APG tabs', () => {
  it('sets role=tablist, role=tab, role=tabpanel', () => {
    const { root, tabs, panels } = buildTabs()
    attach(root)
    expect(root.querySelector('[data-tablist]')?.getAttribute('role')).toBe('tablist')
    expect(tabs[0]?.getAttribute('role')).toBe('tab')
    expect(panels[0]?.getAttribute('role')).toBe('tabpanel')
  })

  it('sets aria-selected=true on active tab, false on others', () => {
    const { root, tabs } = buildTabs()
    attach(root)
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true')
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('false')
    expect(tabs[2]?.getAttribute('aria-selected')).toBe('false')
  })

  it('links tab to panel via aria-controls and aria-labelledby', () => {
    const { root, tabs, panels } = buildTabs()
    attach(root)
    expect(tabs[0]?.getAttribute('aria-controls')).toBe(panels[0]?.id)
    expect(panels[0]?.getAttribute('aria-labelledby')).toBe(tabs[0]?.id)
  })

  it('tabpanel gets tabindex=0 for keyboard access', () => {
    const { root, panels } = buildTabs()
    attach(root)
    expect(panels[0]?.getAttribute('tabindex')).toBe('0')
  })

  it('ArrowRight moves focus to next tab (auto activation)', () => {
    const { root, tabs } = buildTabs()
    attach(root)
    tabs[0]?.focus()
    press(tabs[0] as HTMLElement, 'ArrowRight')
    expect(document.activeElement).toBe(tabs[1])
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
  })

  it('ArrowLeft moves focus to previous tab', () => {
    const { root, tabs } = buildTabs()
    attach(root)
    tabs[1]?.focus()
    press(tabs[1] as HTMLElement, 'ArrowLeft')
    expect(document.activeElement).toBe(tabs[0])
  })

  it('ArrowRight wraps from last to first', () => {
    const { root, tabs } = buildTabs()
    attach(root)
    tabs[2]?.focus()
    press(tabs[2] as HTMLElement, 'ArrowRight')
    expect(document.activeElement).toBe(tabs[0])
  })

  it('ArrowLeft wraps from first tab to last', () => {
    const { root, tabs } = buildTabs()
    attach(root)
    tabs[0]?.focus()
    press(tabs[0] as HTMLElement, 'ArrowLeft')
    expect(document.activeElement).toBe(tabs[2])
  })

  it('Home focuses first tab', () => {
    const { root, tabs } = buildTabs()
    attach(root)
    tabs[2]?.focus()
    press(tabs[2] as HTMLElement, 'Home')
    expect(document.activeElement).toBe(tabs[0])
  })

  it('End focuses last tab', () => {
    const { root, tabs } = buildTabs()
    attach(root)
    tabs[0]?.focus()
    press(tabs[0] as HTMLElement, 'End')
    expect(document.activeElement).toBe(tabs[2])
  })

  it('click activates tab and shows panel', () => {
    const { root, tabs, panels } = buildTabs()
    attach(root)
    click(tabs[1] as HTMLElement)
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
    expect(panels[1]?.hasAttribute('hidden')).toBe(false)
    expect(panels[0]?.hasAttribute('hidden')).toBe(true)
  })

  it('vertical orientation: sets aria-orientation=vertical on tablist', () => {
    const { root } = buildTabs()
    attach(root, { orientation: 'vertical' })
    const tablist = root.querySelector('[data-tablist]')
    expect(tablist?.getAttribute('aria-orientation')).toBe('vertical')
  })

  it('vertical orientation: ArrowDown moves focus to next tab', () => {
    const { root, tabs } = buildTabs()
    attach(root, { orientation: 'vertical' })
    tabs[0]?.focus()
    press(tabs[0] as HTMLElement, 'ArrowDown')
    expect(document.activeElement).toBe(tabs[1])
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
  })

  it('manual activation: ArrowRight moves focus but does not activate', () => {
    const { root, tabs } = buildTabs()
    attach(root, { activation: 'manual' })
    tabs[0]?.focus()
    press(tabs[0] as HTMLElement, 'ArrowRight')
    expect(document.activeElement).toBe(tabs[1])
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('false')
  })

  it('manual activation: Enter activates focused tab', () => {
    const { root, tabs, panels } = buildTabs()
    attach(root, { activation: 'manual' })
    tabs[0]?.focus()
    press(tabs[0] as HTMLElement, 'ArrowRight')
    press(tabs[1] as HTMLElement, 'Enter')
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
    expect(panels[1]?.hasAttribute('hidden')).toBe(false)
  })

  it('manual activation: Space activates focused tab', () => {
    const { root, tabs, panels } = buildTabs()
    attach(root, { activation: 'manual' })
    tabs[0]?.focus()
    press(tabs[0] as HTMLElement, 'ArrowRight')
    press(tabs[1] as HTMLElement, ' ')
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true')
    expect(panels[1]?.hasAttribute('hidden')).toBe(false)
  })
})
