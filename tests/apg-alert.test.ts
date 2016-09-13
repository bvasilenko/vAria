
import { describe, it, expect, afterEach } from 'vitest'
import { attach } from '../src/alert/alert.js'
import { createEl, cleanup } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

describe('APG alert', () => {
  it('sets role=alert and aria-live=assertive by default', () => {
    const el = mount('<div>An error occurred</div>')
    attach(el)
    expect(el.getAttribute('role')).toBe('alert')
    expect(el.getAttribute('aria-live')).toBe('assertive')
    expect(el.getAttribute('aria-atomic')).toBe('true')
  })

  it('sets role=status and aria-live=polite when politeness=polite', () => {
    const el = mount('<div>Saving...</div>')
    attach(el, { politeness: 'polite' })
    expect(el.getAttribute('role')).toBe('status')
    expect(el.getAttribute('aria-live')).toBe('polite')
    expect(el.getAttribute('aria-atomic')).toBe('true')
  })
})
