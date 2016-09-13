
import { guardIdempotent } from '../core/idempotent.js'
import type { Disposer } from '../core/idempotent.js'

export interface AlertOptions {
  readonly politeness?: 'assertive' | 'polite'
}

// APG: https://www.w3.org/WAI/ARIA/apg/patterns/alert/

function initAlert(root: HTMLElement, options: AlertOptions): Disposer {
  const politeness = options.politeness ?? 'assertive'
  const role = politeness === 'assertive' ? 'alert' : 'status'

  root.setAttribute('role', role)
  root.setAttribute('aria-live', politeness)
  root.setAttribute('aria-atomic', 'true')

  return () => {
    root.removeAttribute('role')
    root.removeAttribute('aria-live')
    root.removeAttribute('aria-atomic')
  }
}

export function attach(root: HTMLElement, options: AlertOptions = {}): Disposer {
  return guardIdempotent(root, () => initAlert(root, options))
}
