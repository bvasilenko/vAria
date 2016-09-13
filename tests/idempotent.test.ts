
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { attach as attachDialog } from '../src/dialog/dialog.js'
import { attach as attachAccordion } from '../src/accordion/accordion.js'
import { attach as attachTabs } from '../src/tabs/tabs.js'
import { attach as attachDisclosure } from '../src/disclosure/disclosure.js'
import { attach as attachAlert } from '../src/alert/alert.js'
import { attach as attachSwitch } from '../src/switch/switch.js'
import { attach as attachListbox } from '../src/listbox/listbox.js'
import { attach as attachMenu } from '../src/menu/menu.js'
import { createEl, cleanup } from './helpers.js'

let root: HTMLElement

beforeEach(() => { root = createEl('<div></div>') })
afterEach(() => { cleanup(root) })

describe('idempotent attach', () => {
  it('dialog: second attach returns same disposer, single role attr', () => {
    const dialog = createEl('<div id="d" hidden></div>')
    const d1 = attachDialog(dialog)
    const d2 = attachDialog(dialog)
    expect(d1).toBe(d2)
    expect(dialog.getAttribute('role')).toBe('dialog')
    d1()
    cleanup(dialog)
  })

  it('accordion: second attach returns same disposer', () => {
    const acc = createEl(`
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
    cleanup(acc)
  })

  it('tabs: second attach returns same disposer', () => {
    const tabs = createEl(`
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
    cleanup(tabs)
  })

  it('disclosure: second attach returns same disposer', () => {
    const disc = createEl(`
      <div>
        <button data-disclosure-trigger>T</button>
        <div data-disclosure-panel>P</div>
      </div>`)
    const d1 = attachDisclosure(disc)
    const d2 = attachDisclosure(disc)
    expect(d1).toBe(d2)
    d1()
    cleanup(disc)
  })

  it('alert: second attach returns same disposer, single role attr', () => {
    const alert = createEl('<div>Alert</div>')
    const d1 = attachAlert(alert)
    const d2 = attachAlert(alert)
    expect(d1).toBe(d2)
    expect(alert.getAttribute('role')).toBe('alert')
    d1()
    cleanup(alert)
  })

  it('switch: second attach returns same disposer', () => {
    const sw = createEl('<div><button data-switch>Toggle</button></div>')
    const d1 = attachSwitch(sw)
    const d2 = attachSwitch(sw)
    expect(d1).toBe(d2)
    d1()
    cleanup(sw)
  })

  it('listbox: second attach returns same disposer', () => {
    const lb = createEl('<div><div data-option>A</div></div>')
    const d1 = attachListbox(lb)
    const d2 = attachListbox(lb)
    expect(d1).toBe(d2)
    d1()
    cleanup(lb)
  })

  it('menu: second attach returns same disposer', () => {
    const menu = createEl('<div><div data-menu-item>Item</div></div>')
    const d1 = attachMenu(menu)
    const d2 = attachMenu(menu)
    expect(d1).toBe(d2)
    d1()
    cleanup(menu)
  })
})
