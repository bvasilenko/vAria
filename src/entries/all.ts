// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { attach as attachDialog } from '../dialog/dialog.js'
import { attach as attachAccordion } from '../accordion/accordion.js'
import { attach as attachTabs } from '../tabs/tabs.js'
import { attach as attachCombobox } from '../combobox/combobox.js'
import { attach as attachTooltip } from '../tooltip/tooltip.js'
import { attach as attachAlert } from '../alert/alert.js'
import { attach as attachDisclosure } from '../disclosure/disclosure.js'
import { attach as attachMenu } from '../menu/menu.js'
import { attach as attachMenubutton } from '../menubutton/menubutton.js'
import { attach as attachListbox } from '../listbox/listbox.js'
import { attach as attachSwitch } from '../switch/switch.js'
import type { Disposer } from '../core/idempotent.js'

const PATTERN_MAP: Record<string, ((root: HTMLElement) => Disposer) | undefined> = {
  dialog: attachDialog,
  accordion: attachAccordion,
  tabs: attachTabs,
  combobox: attachCombobox,
  tooltip: attachTooltip,
  alert: attachAlert,
  disclosure: attachDisclosure,
  menu: attachMenu,
  menubutton: attachMenubutton,
  listbox: attachListbox,
  switch: attachSwitch,
}

export function attach(root: Element = document.documentElement): Disposer {
  const disposers: Disposer[] = []

  root.querySelectorAll<HTMLElement>('[data-v-pattern]').forEach((el) => {
    const name = el.getAttribute('data-v-pattern')
    if (!name) return
    const attachFn = PATTERN_MAP[name]
    if (attachFn) disposers.push(attachFn(el))
  })

  return () => { disposers.forEach((d) => { d() }) }
}

if (typeof document !== 'undefined' && document.readyState !== 'loading') {
  attach()
} else if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => { attach() }, { once: true })
}
