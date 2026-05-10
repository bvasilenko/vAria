// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { createFocusTrap, getFocusableElements } from '../core/focus-trap.js'
import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface DialogOptions {
  readonly onOpen?: () => void
  readonly onClose?: () => void
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

function resolveLabel(root: HTMLElement): void {
  if (root.hasAttribute('aria-labelledby') || root.hasAttribute('aria-label')) return
  const heading = root.querySelector<HTMLElement>('h1,h2,h3,h4,h5,h6,[data-dialog-title]')
  if (heading) {
    if (!heading.id) heading.id = `v-dialog-title-${Math.random().toString(36).slice(2)}`
    root.setAttribute('aria-labelledby', heading.id)
  }
}

function setInert(exclude: HTMLElement, inert: boolean): void {
  Array.from(document.body.children).forEach((child) => {
    if (child === exclude || child.contains(exclude)) return
    if (inert) {
      child.setAttribute('inert', '')
      child.setAttribute('aria-hidden', 'true')
    } else {
      child.removeAttribute('inert')
      child.removeAttribute('aria-hidden')
    }
  })
}

function initDialog(root: HTMLElement, options: DialogOptions): Disposer {
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  resolveLabel(root)

  let triggerElement: HTMLElement | null = null
  const trap = createFocusTrap(root)

  function open(): void {
    root.removeAttribute('hidden')
    root.setAttribute('data-state', 'open')
    setInert(root, true)
    trap.activate()

    const firstFocusable = getFocusableElements(root)[0]
    if (firstFocusable) firstFocusable.focus()
    else { root.setAttribute('tabindex', '-1'); root.focus() }

    options.onOpen?.()
  }

  function close(): void {
    root.setAttribute('hidden', '')
    root.setAttribute('data-state', 'closed')
    setInert(root, false)
    trap.deactivate()
    triggerElement?.focus()
    triggerElement = null
    options.onClose?.()
  }

  function handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement
    const openBtn = target.closest<HTMLElement>('[data-dialog-open]')
    if (openBtn) {
      const targetId = openBtn.getAttribute('data-dialog-open')
      if (targetId && document.getElementById(targetId) === root) {
        triggerElement = openBtn
        open()
        return
      }
    }

    const closeBtn = target.closest<HTMLElement>('[data-dialog-close]')
    if (closeBtn && root.contains(closeBtn)) {
      close()
      return
    }

    const overlay = target.closest<HTMLElement>('[data-dialog-overlay]')
    if (overlay && root.contains(overlay)) {
      close()
    }
  }

  function handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && root.getAttribute('data-state') === 'open') {
      event.stopPropagation()
      close()
    }
  }

  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown, { capture: true })

  return () => {
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleDocumentKeydown, { capture: true })
    trap.deactivate()
    setInert(root, false)
    root.removeAttribute('role')
    root.removeAttribute('aria-modal')
    root.removeAttribute('data-state')
    root.removeAttribute('tabindex')
  }
}

export function attach(root: HTMLElement, options: DialogOptions = {}): Disposer {
  return guardIdempotent(root, () => initDialog(root, options))
}
