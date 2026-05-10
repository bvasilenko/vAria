// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect } from 'vitest'
import { attach as attachDialog } from '../src/dialog/dialog.js'
import { attach as attachAccordion } from '../src/accordion/accordion.js'
import { attach as attachTabs } from '../src/tabs/tabs.js'
import { attach as attachDisclosure } from '../src/disclosure/disclosure.js'
import { attach as attachAlert } from '../src/alert/alert.js'
import { attach as attachSwitch } from '../src/switch/switch.js'
import { attach as attachListbox } from '../src/listbox/listbox.js'
import { attach as attachMenu } from '../src/menu/menu.js'
import { attach as attachCombobox } from '../src/combobox/combobox.js'
import { attach as attachTooltip } from '../src/tooltip/tooltip.js'
import { attach as attachMenubutton } from '../src/menubutton/menubutton.js'
import { useMountFixture } from './helpers.js'

const mount = useMountFixture()

describe('idempotent attach', () => {
  it('dialog: second attach returns same disposer, single role attr', () => {
    const dialog = mount('<div id="d" hidden></div>')
    const d1 = attachDialog(dialog)
    const d2 = attachDialog(dialog)
    expect(d1).toBe(d2)
    expect(dialog.getAttribute('role')).toBe('dialog')
    d1()
  })

  it('accordion: second attach returns same disposer', () => {
    const acc = mount(`
      <div>
        <div data-accordion-item>
          <button data-accordion-trigger>T</button>
          <div data-accordion-panel>P</div>
        </div>
      </div>`)
    const d1 = attachAccordion(acc)
    const d2 = attachAccordion(acc)
    expect(d1).toBe(d2)
    d1()
  })

  it('tabs: second attach returns same disposer', () => {
    const tabs = mount(`
      <div>
        <div data-tablist>
          <button data-tab aria-selected="true" data-tabs-value="a">A</button>
        </div>
        <div data-tabpanel>A panel</div>
      </div>`)
    const d1 = attachTabs(tabs)
    const d2 = attachTabs(tabs)
    expect(d1).toBe(d2)
    d1()
  })

  it('disclosure: second attach returns same disposer', () => {
    const disc = mount(`
      <div>
        <button data-disclosure-trigger>T</button>
        <div data-disclosure-panel>P</div>
      </div>`)
    const d1 = attachDisclosure(disc)
    const d2 = attachDisclosure(disc)
    expect(d1).toBe(d2)
    d1()
  })

  it('alert: second attach returns same disposer, single role attr', () => {
    const alert = mount('<div>Alert</div>')
    const d1 = attachAlert(alert)
    const d2 = attachAlert(alert)
    expect(d1).toBe(d2)
    expect(alert.getAttribute('role')).toBe('alert')
    d1()
  })

  it('switch: second attach returns same disposer', () => {
    const sw = mount('<div><button data-switch>Toggle</button></div>')
    const d1 = attachSwitch(sw)
    const d2 = attachSwitch(sw)
    expect(d1).toBe(d2)
    d1()
  })

  it('listbox: second attach returns same disposer', () => {
    const lb = mount('<div><div data-option>A</div></div>')
    const d1 = attachListbox(lb)
    const d2 = attachListbox(lb)
    expect(d1).toBe(d2)
    d1()
  })

  it('menu: second attach returns same disposer', () => {
    const menu = mount('<div><div data-menu-item>Item</div></div>')
    const d1 = attachMenu(menu)
    const d2 = attachMenu(menu)
    expect(d1).toBe(d2)
    d1()
  })

  it('combobox: second attach returns same disposer', () => {
    const el = mount(`
      <div>
        <input type="text">
        <ul role="listbox" hidden><li data-option>Option A</li></ul>
      </div>`)
    const d1 = attachCombobox(el)
    const d2 = attachCombobox(el)
    expect(d1).toBe(d2)
    d1()
  })

  it('tooltip: second attach returns same disposer', () => {
    const el = mount(`
      <div>
        <button data-tooltip-trigger>Hover</button>
        <span data-tooltip-content>Tip text</span>
      </div>`)
    const d1 = attachTooltip(el)
    const d2 = attachTooltip(el)
    expect(d1).toBe(d2)
    d1()
  })

  it('menubutton: second attach returns same disposer', () => {
    const el = mount(`
      <div>
        <button data-menubutton-trigger>Actions</button>
        <div data-menu><div data-menu-item>Edit</div></div>
      </div>`)
    const d1 = attachMenubutton(el)
    const d2 = attachMenubutton(el)
    expect(d1).toBe(d2)
    d1()
  })
})
