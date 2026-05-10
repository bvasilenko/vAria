// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, afterEach } from 'vitest'
import { attach } from '../src/dialog/dialog.js'
import { createEl, cleanup, press, click } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement {
  const el = createEl(html)
  containers.push(el)
  return el
}
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

function buildDialog(): { root: HTMLElement; trigger: HTMLButtonElement; dialog: HTMLElement; first: HTMLButtonElement; last: HTMLButtonElement } {
  const root = mount(`
    <div>
      <button id="trigger" data-dialog-open="dlg">Open</button>
      <div id="dlg" hidden>
        <h2>Title</h2>
        <button id="first">First</button>
        <button id="last">Last</button>
        <button data-dialog-close>Close</button>
      </div>
    </div>`)
  const dialog = root.querySelector<HTMLElement>('#dlg') as HTMLElement
  const trigger = root.querySelector<HTMLButtonElement>('#trigger') as HTMLButtonElement
  const first = root.querySelector<HTMLButtonElement>('#first') as HTMLButtonElement
  const last = root.querySelector<HTMLButtonElement>('#last') as HTMLButtonElement
  return { root, trigger, dialog, first, last }
}

describe('APG dialog', () => {
  it('sets role=dialog and aria-modal', () => {
    const { dialog } = buildDialog()
    attach(dialog)
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('sets aria-labelledby from heading', () => {
    const { dialog } = buildDialog()
    attach(dialog)
    const heading = dialog.querySelector('h2') as HTMLElement
    expect(dialog.getAttribute('aria-labelledby')).toBe(heading.id)
  })

  it('opens dialog and sets data-state=open on trigger click', () => {
    const { dialog, trigger } = buildDialog()
    attach(dialog)
    click(trigger)
    expect(dialog.getAttribute('data-state')).toBe('open')
    expect(dialog.hasAttribute('hidden')).toBe(false)
  })

  it('closes with Escape key', () => {
    const { dialog, trigger } = buildDialog()
    attach(dialog)
    click(trigger)
    expect(dialog.getAttribute('data-state')).toBe('open')
    press(document, 'Escape', { bubbles: true })
    expect(dialog.getAttribute('data-state')).toBe('closed')
    expect(dialog.hasAttribute('hidden')).toBe(true)
  })

  it('closes with data-dialog-close button', () => {
    const { dialog, trigger } = buildDialog()
    attach(dialog)
    click(trigger)
    const closeBtn = dialog.querySelector('[data-dialog-close]') as HTMLButtonElement
    click(closeBtn)
    expect(dialog.getAttribute('data-state')).toBe('closed')
  })

  it('Tab on last focusable element wraps focus to first', () => {
    const { dialog, trigger, first } = buildDialog()
    attach(dialog)
    click(trigger)
    const closeBtn = dialog.querySelector('[data-dialog-close]') as HTMLButtonElement
    closeBtn.focus()
    press(dialog, 'Tab')
    expect(document.activeElement).toBe(first)
  })

  it('Shift+Tab on first focusable element wraps focus to last', () => {
    const { dialog, trigger, first } = buildDialog()
    attach(dialog)
    click(trigger)
    first.focus()
    const closeBtn = dialog.querySelector('[data-dialog-close]') as HTMLButtonElement
    press(dialog, 'Tab', { shiftKey: true })
    expect(document.activeElement).toBe(closeBtn)
  })

  it('focus returns to trigger element after dialog closes', () => {
    const { dialog, trigger } = buildDialog()
    attach(dialog)
    trigger.focus()
    click(trigger)
    press(document, 'Escape', { bubbles: true })
    expect(document.activeElement).toBe(trigger)
  })

  it('clicking data-dialog-overlay closes dialog', () => {
    const root = mount(`
      <div>
        <button data-dialog-open="dlg2">Open</button>
        <div id="dlg2" hidden>
          <h2>Title</h2>
          <button data-dialog-close>Close</button>
          <div data-dialog-overlay></div>
        </div>
      </div>`)
    const dialog = root.querySelector<HTMLElement>('#dlg2') as HTMLElement
    const trigger = root.querySelector<HTMLButtonElement>('[data-dialog-open]') as HTMLButtonElement
    const overlay = root.querySelector<HTMLElement>('[data-dialog-overlay]') as HTMLElement
    attach(dialog)
    click(trigger)
    click(overlay)
    expect(dialog.getAttribute('data-state')).toBe('closed')
    expect(dialog.hasAttribute('hidden')).toBe(true)
  })
})
