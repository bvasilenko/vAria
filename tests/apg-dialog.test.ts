// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { describe, it, expect, vi } from 'vitest'
import { attach } from '../src/dialog/dialog.js'
import { useMountFixture, press, click } from './helpers.js'

const mount = useMountFixture()

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

describe('APG dialog — resolveLabel edge cases', () => {
  it('heading with a pre-existing id is used directly without generating a new one', () => {
    const root = mount('<div><div id="d" hidden><h2 id="my-title">Title</h2></div></div>')
    const el = root.querySelector<HTMLElement>('#d') as HTMLElement
    attach(el)
    expect(el.getAttribute('aria-labelledby')).toBe('my-title')
    expect(root.querySelectorAll('#my-title').length).toBe(1)
  })

  it('dialog with aria-label already set is not overridden', () => {
    const root = mount('<div><div id="d" hidden aria-label="Custom"><h2>Title</h2></div></div>')
    const el = root.querySelector<HTMLElement>('#d') as HTMLElement
    attach(el)
    expect(el.getAttribute('aria-label')).toBe('Custom')
    expect(el.hasAttribute('aria-labelledby')).toBe(false)
  })

  it('dialog with aria-labelledby already set is not overridden', () => {
    const root = mount('<div><div id="d" hidden aria-labelledby="external-title"></div></div>')
    const el = root.querySelector<HTMLElement>('#d') as HTMLElement
    attach(el)
    expect(el.getAttribute('aria-labelledby')).toBe('external-title')
  })

  it('dialog with no heading gets no aria-labelledby', () => {
    const root = mount('<div><div id="d" hidden><p>No heading here</p></div></div>')
    const el = root.querySelector<HTMLElement>('#d') as HTMLElement
    attach(el)
    expect(el.hasAttribute('aria-labelledby')).toBe(false)
  })
})

describe('APG dialog — focus fallback when no focusable children', () => {
  it('sets tabindex=-1 and focuses root when dialog has no focusable children', () => {
    const root = mount(`
      <div>
        <button data-dialog-open="dlg3">Open</button>
        <div id="dlg3" hidden><p>No focusable content.</p></div>
      </div>`)
    const dialog = root.querySelector<HTMLElement>('#dlg3') as HTMLElement
    const trigger = root.querySelector<HTMLButtonElement>('[data-dialog-open]') as HTMLButtonElement
    attach(dialog)
    click(trigger)
    expect(dialog.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(dialog)
  })
})

describe('APG dialog — setInert marks and unmarks body siblings', () => {
  it('siblings outside the dialog container receive inert and aria-hidden when dialog opens', () => {
    const sibling = document.createElement('div')
    sibling.id = 'inert-sibling'
    document.body.appendChild(sibling)

    const root = mount(`
      <div>
        <button data-dialog-open="dlg-inert">Open</button>
        <div id="dlg-inert" hidden><button data-dialog-close>Close</button></div>
      </div>`)
    const dialog = root.querySelector<HTMLElement>('#dlg-inert') as HTMLElement
    const trigger = root.querySelector<HTMLButtonElement>('[data-dialog-open]') as HTMLButtonElement
    attach(dialog)
    click(trigger)

    expect(sibling.hasAttribute('inert')).toBe(true)
    expect(sibling.getAttribute('aria-hidden')).toBe('true')

    sibling.remove()
  })

  it('siblings have inert and aria-hidden removed when dialog closes', () => {
    const sibling = document.createElement('div')
    sibling.id = 'inert-sibling-close'
    document.body.appendChild(sibling)

    const root = mount(`
      <div>
        <button data-dialog-open="dlg-inert2">Open</button>
        <div id="dlg-inert2" hidden><button data-dialog-close>Close</button></div>
      </div>`)
    const dialog = root.querySelector<HTMLElement>('#dlg-inert2') as HTMLElement
    const trigger = root.querySelector<HTMLButtonElement>('[data-dialog-open]') as HTMLButtonElement
    const closeBtn = dialog.querySelector<HTMLButtonElement>('[data-dialog-close]') as HTMLButtonElement
    attach(dialog)
    click(trigger)
    click(closeBtn)

    expect(sibling.hasAttribute('inert')).toBe(false)
    expect(sibling.getAttribute('aria-hidden')).toBeNull()

    sibling.remove()
  })
})

describe('APG dialog — lifecycle callbacks', () => {
  it('onOpen fires once when dialog is opened', () => {
    const { dialog, trigger } = buildDialog()
    const onOpen = vi.fn()
    attach(dialog, { onOpen })
    click(trigger)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('onClose fires once when dialog is closed via Escape', () => {
    const { dialog, trigger } = buildDialog()
    const onClose = vi.fn()
    attach(dialog, { onClose })
    click(trigger)
    press(document, 'Escape', { bubbles: true })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('onClose fires when dialog closes via close button', () => {
    const { dialog, trigger } = buildDialog()
    const onClose = vi.fn()
    attach(dialog, { onClose })
    click(trigger)
    const closeBtn = dialog.querySelector('[data-dialog-close]') as HTMLButtonElement
    click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
