// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach } from 'vitest'
import { attach as attachDialog } from '../src/dialog/dialog.js'
import { attach as attachAccordion } from '../src/accordion/accordion.js'
import { attach as attachTabs } from '../src/tabs/tabs.js'
import { attach as attachDisclosure } from '../src/disclosure/disclosure.js'
import { attach as attachAlert } from '../src/alert/alert.js'
import { attach as attachSwitch } from '../src/switch/switch.js'
import { attach as attachListbox } from '../src/listbox/listbox.js'
import { attach as attachMenu } from '../src/menu/menu.js'
import { attach as attachTooltip } from '../src/tooltip/tooltip.js'
import { createEl, cleanup } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement {
  const el = createEl(html)
  containers.push(el)
  return el
}
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

describe('dispose restores aria/tabindex state', () => {
  it('dialog: role and aria-modal removed after dispose', () => {
    const el = mount('<div id="d" hidden></div>')
    const dispose = attachDialog(el)
    expect(el.getAttribute('role')).toBe('dialog')
    dispose()
    expect(el.getAttribute('role')).toBeNull()
    expect(el.getAttribute('aria-modal')).toBeNull()
    expect(el.getAttribute('data-state')).toBeNull()
  })

  it('accordion: aria-controls, role=region removed after dispose', () => {
    const el = mount(`
      <div>
        <div data-accordion-item>
          <button data-accordion-trigger>T</button>
          <div data-accordion-panel>P</div>
        </div>
      </div>`)
    const dispose = attachAccordion(el)
    const trigger = el.querySelector('[data-accordion-trigger]') as HTMLElement
    const panel = el.querySelector('[data-accordion-panel]') as HTMLElement
    expect(trigger.getAttribute('aria-controls')).toBeTruthy()
    expect(panel.getAttribute('role')).toBe('region')
    dispose()
    expect(trigger.getAttribute('aria-controls')).toBeNull()
    expect(panel.getAttribute('role')).toBeNull()
    expect(panel.getAttribute('aria-labelledby')).toBeNull()
  })

  it('tabs: roles, aria-selected, aria-controls removed after dispose', () => {
    const el = mount(`
      <div>
        <div data-tablist>
          <button data-tab>A</button>
        </div>
        <div data-tabpanel>A</div>
      </div>`)
    const dispose = attachTabs(el)
    const tab = el.querySelector('[data-tab]') as HTMLElement
    expect(tab.getAttribute('role')).toBe('tab')
    dispose()
    expect(tab.getAttribute('role')).toBeNull()
    expect(tab.getAttribute('aria-selected')).toBeNull()
  })

  it('disclosure: aria-expanded and aria-controls removed after dispose', () => {
    const el = mount(`
      <div>
        <button data-disclosure-trigger>T</button>
        <div data-disclosure-panel>P</div>
      </div>`)
    const dispose = attachDisclosure(el)
    const trigger = el.querySelector('[data-disclosure-trigger]') as HTMLElement
    expect(trigger.getAttribute('aria-expanded')).toBeDefined()
    dispose()
    expect(trigger.getAttribute('aria-expanded')).toBeNull()
    expect(trigger.getAttribute('aria-controls')).toBeNull()
  })

  it('alert: role and aria-live removed after dispose', () => {
    const el = mount('<div>Alert text</div>')
    const dispose = attachAlert(el)
    expect(el.getAttribute('role')).toBe('alert')
    expect(el.getAttribute('aria-live')).toBe('assertive')
    dispose()
    expect(el.getAttribute('role')).toBeNull()
    expect(el.getAttribute('aria-live')).toBeNull()
    expect(el.getAttribute('aria-atomic')).toBeNull()
  })

  it('switch: role=switch and aria-checked removed after dispose', () => {
    const el = mount('<div><button data-switch>Toggle</button></div>')
    const dispose = attachSwitch(el)
    const btn = el.querySelector('[data-switch]') as HTMLElement
    expect(btn.getAttribute('role')).toBe('switch')
    dispose()
    expect(btn.getAttribute('role')).toBeNull()
    expect(btn.getAttribute('aria-checked')).toBeNull()
  })

  it('listbox: role and aria-multiselectable removed after dispose', () => {
    const el = mount('<div><div data-option>A</div></div>')
    const dispose = attachListbox(el)
    expect(el.getAttribute('role')).toBe('listbox')
    dispose()
    expect(el.getAttribute('role')).toBeNull()
    expect(el.getAttribute('aria-multiselectable')).toBeNull()
    expect(el.getAttribute('tabindex')).toBeNull()
  })

  it('menu: role=menu removed after dispose', () => {
    const el = mount('<div><div data-menu-item>Item</div></div>')
    const dispose = attachMenu(el)
    expect(el.getAttribute('role')).toBe('menu')
    dispose()
    expect(el.getAttribute('role')).toBeNull()
  })

  it('tooltip: role=tooltip and aria-describedby removed after dispose', () => {
    const el = mount('<div><button data-tooltip-trigger>Hover</button><span data-tooltip-content>Tip</span></div>')
    const dispose = attachTooltip(el)
    const tip = el.querySelector('[data-tooltip-content]') as HTMLElement
    const trigger = el.querySelector('[data-tooltip-trigger]') as HTMLElement
    expect(tip.getAttribute('role')).toBe('tooltip')
    dispose()
    expect(tip.getAttribute('role')).toBeNull()
    expect(trigger.getAttribute('aria-describedby')).toBeNull()
  })

  it('attach after dispose re-initialises cleanly', () => {
    const el = mount('<div>Alert</div>')
    const d1 = attachAlert(el)
    d1()
    const d2 = attachAlert(el)
    expect(el.getAttribute('role')).toBe('alert')
    d2()
    expect(el.getAttribute('role')).toBeNull()
  })
})
