// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface AccordionOptions {
  readonly multiple?: boolean
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/

function linkTriggerPanel(trigger: HTMLElement, panel: HTMLElement): void {
  if (!panel.id) panel.id = `v-accordion-panel-${Math.random().toString(36).slice(2)}`
  if (!trigger.id) trigger.id = `v-accordion-trigger-${Math.random().toString(36).slice(2)}`

  trigger.setAttribute('aria-controls', panel.id)
  panel.setAttribute('role', 'region')
  panel.setAttribute('aria-labelledby', trigger.id)
}

function setExpanded(trigger: HTMLElement, panel: HTMLElement, expanded: boolean): void {
  trigger.setAttribute('aria-expanded', String(expanded))
  panel.setAttribute('data-state', expanded ? 'open' : 'closed')
  if (expanded) panel.removeAttribute('hidden')
  else panel.setAttribute('hidden', '')
}

function initAccordion(root: HTMLElement, options: AccordionOptions): Disposer {
  const multiple = options.multiple ?? root.dataset['accordionMultiple'] === 'true'
  const cleanups: Disposer[] = []

  function getItems(): Array<{ trigger: HTMLElement; panel: HTMLElement }> {
    return Array.from(root.querySelectorAll<HTMLElement>('[data-accordion-item]')).flatMap(
      (item) => {
        const trigger = item.querySelector<HTMLElement>('[data-accordion-trigger]')
        const panel = item.querySelector<HTMLElement>('[data-accordion-panel]')
        return trigger && panel ? [{ trigger, panel }] : []
      },
    )
  }

  function closeOthers(activeTrigger: HTMLElement): void {
    getItems().forEach(({ trigger, panel }) => {
      if (trigger !== activeTrigger && trigger.getAttribute('aria-expanded') === 'true') {
        setExpanded(trigger, panel, false)
      }
    })
  }

  const items = getItems()
  const triggers = items.map((i) => i.trigger)

  items.forEach(({ trigger, panel }) => {
    linkTriggerPanel(trigger, panel)
    const initiallyOpen = trigger.getAttribute('aria-expanded') === 'true'
    setExpanded(trigger, panel, initiallyOpen)

    function onClick(): void {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true'
      if (!isOpen && !multiple) closeOthers(trigger)
      setExpanded(trigger, panel, !isOpen)
    }

    function onKeydown(event: KeyboardEvent): void {
      const idx = triggers.indexOf(trigger)
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        triggers[(idx + 1) % triggers.length]?.focus()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        triggers[(idx - 1 + triggers.length) % triggers.length]?.focus()
      } else if (event.key === 'Home') {
        event.preventDefault()
        triggers[0]?.focus()
      } else if (event.key === 'End') {
        event.preventDefault()
        triggers[triggers.length - 1]?.focus()
      }
    }

    trigger.addEventListener('click', onClick)
    trigger.addEventListener('keydown', onKeydown)
    cleanups.push(() => {
      trigger.removeEventListener('click', onClick)
      trigger.removeEventListener('keydown', onKeydown)
      trigger.removeAttribute('aria-controls')
      trigger.removeAttribute('aria-expanded')
      panel.removeAttribute('role')
      panel.removeAttribute('aria-labelledby')
      panel.removeAttribute('data-state')
      panel.removeAttribute('hidden')
    })
  })

  return () => { cleanups.forEach((fn) => { fn() }) }
}

export function attach(root: HTMLElement, options: AccordionOptions = {}): Disposer {
  return guardIdempotent(root, () => initAccordion(root, options))
}
