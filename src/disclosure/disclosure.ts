// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface DisclosureOptions {
  readonly defaultOpen?: boolean
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/

function initDisclosureInner(
  trigger: HTMLElement,
  panel: HTMLElement,
  options: DisclosureOptions,
): Disposer {
  if (!panel.id) panel.id = `v-disclosure-${Math.random().toString(36).slice(2)}`
  trigger.setAttribute('aria-controls', panel.id)

  const initiallyOpen =
    options.defaultOpen ??
    trigger.getAttribute('aria-expanded') === 'true'

  function setState(open: boolean): void {
    trigger.setAttribute('aria-expanded', String(open))
    panel.setAttribute('data-state', open ? 'open' : 'closed')
    if (open) panel.removeAttribute('hidden')
    else panel.setAttribute('hidden', '')
  }

  setState(initiallyOpen)

  function onClick(): void {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true'
    setState(!isOpen)
  }

  trigger.addEventListener('click', onClick)

  return () => {
    trigger.removeEventListener('click', onClick)
    trigger.removeAttribute('aria-expanded')
    trigger.removeAttribute('aria-controls')
    panel.removeAttribute('data-state')
    panel.removeAttribute('hidden')
  }
}

function initDisclosure(root: HTMLElement, options: DisclosureOptions): Disposer {
  const trigger = root.querySelector<HTMLElement>('[data-disclosure-trigger]')
  const panel = root.querySelector<HTMLElement>('[data-disclosure-panel]')
  if (!trigger || !panel) return () => {}
  return initDisclosureInner(trigger, panel, options)
}

export function attach(root: HTMLElement, options: DisclosureOptions = {}): Disposer {
  return guardIdempotent(root, () => initDisclosure(root, options))
}
