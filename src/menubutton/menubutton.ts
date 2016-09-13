
import { initMenu } from '../menu/menu.js'
import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface MenubuttonOptions {
  readonly onOpen?: () => void
  readonly onClose?: () => void
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/

function ensureId(el: HTMLElement, prefix: string): string {
  if (!el.id) el.id = `${prefix}-${Math.random().toString(36).slice(2)}`
  return el.id
}

function getFirstItem(menu: HTMLElement): HTMLElement | null {
  return menu.querySelector<HTMLElement>(
    '[role="menuitem"]:not([aria-disabled="true"]),' +
    '[role="menuitemcheckbox"]:not([aria-disabled="true"]),' +
    '[role="menuitemradio"]:not([aria-disabled="true"])',
  )
}

function getLastItem(menu: HTMLElement): HTMLElement | null {
  const items = menu.querySelectorAll<HTMLElement>(
    '[role="menuitem"]:not([aria-disabled="true"]),' +
    '[role="menuitemcheckbox"]:not([aria-disabled="true"]),' +
    '[role="menuitemradio"]:not([aria-disabled="true"])',
  )
  return items[items.length - 1] ?? null
}

function initMenubuttonInner(
  root: HTMLElement,
  button: HTMLElement,
  menu: HTMLElement,
  options: MenubuttonOptions,
): Disposer {
  const menuId = ensureId(menu, 'v-menu')
  button.setAttribute('aria-haspopup', 'menu')
  button.setAttribute('aria-expanded', 'false')
  button.setAttribute('aria-controls', menuId)
  menu.setAttribute('hidden', '')
  menu.setAttribute('data-state', 'closed')

  const disposeMenu = initMenu(menu, {})

  function openMenu(focusLast = false): void {
    menu.removeAttribute('hidden')
    menu.setAttribute('data-state', 'open')
    button.setAttribute('aria-expanded', 'true')
    options.onOpen?.()
    if (focusLast) getLastItem(menu)?.focus()
    else getFirstItem(menu)?.focus()
  }

  function closeMenu(): void {
    menu.setAttribute('hidden', '')
    menu.setAttribute('data-state', 'closed')
    button.setAttribute('aria-expanded', 'false')
    options.onClose?.()
    button.focus()
  }

  function isOpen(): boolean {
    return button.getAttribute('aria-expanded') === 'true'
  }

  const onButtonKeydown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        event.preventDefault()
        openMenu(false)
        break
      case 'ArrowUp':
        event.preventDefault()
        openMenu(true)
        break
    }
  }

  const onButtonClick = (): void => {
    if (isOpen()) closeMenu()
    else openMenu(false)
  }

  const onMenuKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') { event.stopPropagation(); closeMenu() }
    if (event.key === 'Tab') closeMenu()
  }

  const onOutsideClick = (event: Event): void => {
    if (!root.contains(event.target as Node) && isOpen()) closeMenu()
  }

  button.addEventListener('keydown', onButtonKeydown)
  button.addEventListener('click', onButtonClick)
  menu.addEventListener('keydown', onMenuKeydown)
  document.addEventListener('pointerdown', onOutsideClick)

  return () => {
    button.removeEventListener('keydown', onButtonKeydown)
    button.removeEventListener('click', onButtonClick)
    menu.removeEventListener('keydown', onMenuKeydown)
    document.removeEventListener('pointerdown', onOutsideClick)
    disposeMenu()
    button.removeAttribute('aria-haspopup')
    button.removeAttribute('aria-expanded')
    button.removeAttribute('aria-controls')
    menu.removeAttribute('hidden')
    menu.removeAttribute('data-state')
  }
}

function initMenubutton(root: HTMLElement, options: MenubuttonOptions): Disposer {
  const button = root.querySelector<HTMLElement>('[data-menubutton-trigger]') ?? root
  const menu = root.querySelector<HTMLElement>('[data-menu]')
  if (!menu) return () => { /* no menu found */ }
  return initMenubuttonInner(root, button, menu, options)
}

export function attach(root: HTMLElement, options: MenubuttonOptions = {}): Disposer {
  return guardIdempotent(root, () => initMenubutton(root, options))
}
