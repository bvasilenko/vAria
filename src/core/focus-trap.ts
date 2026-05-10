// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'details > summary:first-child',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

export function getFocusableElements(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]'),
  )
}

export interface FocusTrap {
  readonly activate: () => void
  readonly deactivate: () => void
}

export function createFocusTrap(container: HTMLElement): FocusTrap {
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return

    const focusable = getFocusableElements(container)
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
  }

  return {
    activate() {
      container.addEventListener('keydown', handleKeydown)
    },
    deactivate() {
      container.removeEventListener('keydown', handleKeydown)
    },
  }
}
