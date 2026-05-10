// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface TabsOptions {
  readonly activation?: 'auto' | 'manual'
  readonly orientation?: 'horizontal' | 'vertical'
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/

function ensureId(el: HTMLElement, prefix: string): string {
  if (!el.id) el.id = `${prefix}-${Math.random().toString(36).slice(2)}`
  return el.id
}

function linkTabPanel(tab: HTMLElement, panel: HTMLElement): void {
  const tabId = ensureId(tab, 'v-tab')
  const panelId = ensureId(panel, 'v-tabpanel')
  tab.setAttribute('aria-controls', panelId)
  panel.setAttribute('aria-labelledby', tabId)
}

function activateTab(
  tabs: HTMLElement[],
  panels: HTMLElement[],
  index: number,
): void {
  tabs.forEach((tab, i) => {
    const isActive = i === index
    tab.setAttribute('aria-selected', String(isActive))
    tab.setAttribute('tabindex', isActive ? '0' : '-1')
  })
  panels.forEach((panel, i) => {
    const isActive = i === index
    panel.setAttribute('data-state', isActive ? 'active' : 'inactive')
    if (isActive) panel.removeAttribute('hidden')
    else panel.setAttribute('hidden', '')
  })
}

function initTabs(root: HTMLElement, options: TabsOptions): Disposer {
  const activation = options.activation ?? 'auto'
  const orientation = options.orientation ?? 'horizontal'

  const tablist = root.querySelector<HTMLElement>('[data-tablist]')
  if (!tablist) return () => { /* no tablist found */ }

  tablist.setAttribute('role', 'tablist')
  tablist.setAttribute('aria-orientation', orientation)

  const tabs = Array.from(root.querySelectorAll<HTMLElement>('[data-tab]'))
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tabpanel]'))

  tabs.forEach((tab) => {
    tab.setAttribute('role', 'tab')
    if (!tab.hasAttribute('aria-selected')) tab.setAttribute('aria-selected', 'false')
  })
  panels.forEach((panel) => {
    panel.setAttribute('role', 'tabpanel')
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '0')
  })

  tabs.forEach((tab, i) => {
    const panel = panels[i]
    if (panel) linkTabPanel(tab, panel)
  })

  const initialIndex = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true')
  activateTab(tabs, panels, initialIndex >= 0 ? initialIndex : 0)

  const cleanups: Disposer[] = []
  let focusedIndex = initialIndex >= 0 ? initialIndex : 0

  const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'
  const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'

  function handleTabKeydown(event: KeyboardEvent): void {
    const idx = tabs.indexOf(event.target as HTMLElement)
    if (idx === -1) return

    if (event.key === nextKey) {
      event.preventDefault()
      focusedIndex = (idx + 1) % tabs.length
      tabs[focusedIndex]?.focus()
      if (activation === 'auto') activateTab(tabs, panels, focusedIndex)
    } else if (event.key === prevKey) {
      event.preventDefault()
      focusedIndex = (idx - 1 + tabs.length) % tabs.length
      tabs[focusedIndex]?.focus()
      if (activation === 'auto') activateTab(tabs, panels, focusedIndex)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusedIndex = 0
      tabs[0]?.focus()
      if (activation === 'auto') activateTab(tabs, panels, 0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusedIndex = tabs.length - 1
      tabs[focusedIndex]?.focus()
      if (activation === 'auto') activateTab(tabs, panels, focusedIndex)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activateTab(tabs, panels, idx)
    }
  }

  tabs.forEach((tab, i) => {
    function onClick(): void {
      activateTab(tabs, panels, i)
    }
    tab.addEventListener('click', onClick)
    tab.addEventListener('keydown', handleTabKeydown)
    cleanups.push(() => {
      tab.removeEventListener('click', onClick)
      tab.removeEventListener('keydown', handleTabKeydown)
      tab.removeAttribute('role')
      tab.removeAttribute('aria-selected')
      tab.removeAttribute('aria-controls')
      tab.removeAttribute('tabindex')
    })
  })

  panels.forEach((panel) => {
    cleanups.push(() => {
      panel.removeAttribute('role')
      panel.removeAttribute('aria-labelledby')
      panel.removeAttribute('data-state')
      panel.removeAttribute('hidden')
      panel.removeAttribute('tabindex')
    })
  })

  cleanups.push(() => {
    tablist.removeAttribute('role')
    tablist.removeAttribute('aria-orientation')
  })

  return () => { cleanups.forEach((fn) => { fn() }) }
}

export function attach(root: HTMLElement, options: TabsOptions = {}): Disposer {
  return guardIdempotent(root, () => initTabs(root, options))
}
