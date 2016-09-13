
import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface SwitchOptions {
  readonly onChange?: (checked: boolean, el: HTMLElement) => void
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/switch/

function initSwitch(root: HTMLElement, options: SwitchOptions): Disposer {
  const controls = Array.from(
    root.querySelectorAll<HTMLElement>('[data-switch]'),
  )
  if (controls.length === 0) controls.push(root)

  const cleanups: Array<() => void> = []

  controls.forEach((control) => {
    control.setAttribute('role', 'switch')
    if (!control.hasAttribute('tabindex')) control.setAttribute('tabindex', '0')

    const initialChecked = control.getAttribute('aria-checked') === 'true'
    control.setAttribute('aria-checked', String(initialChecked))

    function toggle(): void {
      const checked = control.getAttribute('aria-checked') !== 'true'
      control.setAttribute('aria-checked', String(checked))
      control.setAttribute('data-state', checked ? 'checked' : 'unchecked')
      options.onChange?.(checked, control)
    }

    const onClick = (): void => { toggle() }
    const onKeydown = (event: KeyboardEvent): void => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        toggle()
      }
    }

    control.addEventListener('click', onClick)
    control.addEventListener('keydown', onKeydown)

    cleanups.push(() => {
      control.removeEventListener('click', onClick)
      control.removeEventListener('keydown', onKeydown)
      control.removeAttribute('role')
      control.removeAttribute('aria-checked')
      control.removeAttribute('data-state')
      control.removeAttribute('tabindex')
    })
  })

  return () => { cleanups.forEach((fn) => { fn() }) }
}

export function attach(root: HTMLElement, options: SwitchOptions = {}): Disposer {
  return guardIdempotent(root, () => initSwitch(root, options))
}
