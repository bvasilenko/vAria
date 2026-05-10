// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface TooltipOptions {
  readonly showDelay?: number
  readonly hideDelay?: number
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/

const DEFAULT_SHOW_DELAY = 300
const DEFAULT_HIDE_DELAY = 100

function ensureId(el: HTMLElement, prefix: string): string {
  if (!el.id) el.id = `${prefix}-${Math.random().toString(36).slice(2)}`
  return el.id
}

function initTooltipInner(
  trigger: HTMLElement,
  tooltip: HTMLElement,
  options: TooltipOptions,
): Disposer {
  const showDelay = options.showDelay ?? DEFAULT_SHOW_DELAY
  const hideDelay = options.hideDelay ?? DEFAULT_HIDE_DELAY

  const tooltipId = ensureId(tooltip, 'v-tooltip')
  tooltip.setAttribute('role', 'tooltip')
  trigger.setAttribute('aria-describedby', tooltipId)
  tooltip.setAttribute('data-state', 'hidden')
  tooltip.setAttribute('hidden', '')

  let showTimer: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  function show(): void {
    if (hideTimer !== null) { clearTimeout(hideTimer); hideTimer = null }
    showTimer = setTimeout(() => {
      tooltip.removeAttribute('hidden')
      tooltip.setAttribute('data-state', 'visible')
    }, showDelay)
  }

  function hide(): void {
    if (showTimer !== null) { clearTimeout(showTimer); showTimer = null }
    hideTimer = setTimeout(() => {
      tooltip.setAttribute('hidden', '')
      tooltip.setAttribute('data-state', 'hidden')
    }, hideDelay)
  }

  const onMouseenter = (): void => { show() }
  const onMouseleave = (): void => { hide() }
  const onFocus = (): void => { show() }
  const onBlur = (): void => { hide() }
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') hide()
  }

  trigger.addEventListener('mouseenter', onMouseenter)
  trigger.addEventListener('mouseleave', onMouseleave)
  trigger.addEventListener('focus', onFocus)
  trigger.addEventListener('blur', onBlur)
  trigger.addEventListener('keydown', onKeydown)

  return () => {
    trigger.removeEventListener('mouseenter', onMouseenter)
    trigger.removeEventListener('mouseleave', onMouseleave)
    trigger.removeEventListener('focus', onFocus)
    trigger.removeEventListener('blur', onBlur)
    trigger.removeEventListener('keydown', onKeydown)
    if (showTimer !== null) clearTimeout(showTimer)
    if (hideTimer !== null) clearTimeout(hideTimer)
    tooltip.removeAttribute('role')
    tooltip.removeAttribute('data-state')
    tooltip.removeAttribute('hidden')
    trigger.removeAttribute('aria-describedby')
  }
}

function initTooltip(root: HTMLElement, options: TooltipOptions): Disposer {
  const trigger = root.querySelector<HTMLElement>('[data-tooltip-trigger]') ?? root
  const tooltip = root.querySelector<HTMLElement>('[data-tooltip-content]')
  if (!tooltip) return () => { /* no tooltip content found */ }
  return initTooltipInner(trigger, tooltip, options)
}

export function attach(root: HTMLElement, options: TooltipOptions = {}): Disposer {
  return guardIdempotent(root, () => initTooltip(root, options))
}
