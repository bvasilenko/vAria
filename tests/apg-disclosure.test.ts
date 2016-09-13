
import { describe, it, expect, afterEach } from 'vitest'
import { attach } from '../src/disclosure/disclosure.js'
import { createEl, cleanup, click } from './helpers.js'

const containers: HTMLElement[] = []
function mount(html: string): HTMLElement { const el = createEl(html); containers.push(el); return el }
afterEach(() => { containers.forEach(cleanup); containers.length = 0 })

function buildDisclosure(open = false): { root: HTMLElement; trigger: HTMLElement; panel: HTMLElement } {
  const root = mount(`
    <div>
      <button data-disclosure-trigger ${open ? 'aria-expanded="true"' : ''}>Show more</button>
      <div data-disclosure-panel ${open ? '' : 'hidden'}>Hidden content</div>
    </div>`)
  return {
    root,
    trigger: root.querySelector('[data-disclosure-trigger]') as HTMLElement,
    panel: root.querySelector('[data-disclosure-panel]') as HTMLElement,
  }
}

describe('APG disclosure', () => {
  it('sets aria-expanded=false and hides panel by default', () => {
    const { root, trigger, panel } = buildDisclosure(false)
    attach(root)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(panel.hasAttribute('hidden')).toBe(true)
  })

  it('sets aria-controls pointing to panel id', () => {
    const { root, trigger, panel } = buildDisclosure()
    attach(root)
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.id).toBeTruthy()
  })

  it('toggle: click opens panel and sets aria-expanded=true', () => {
    const { root, trigger, panel } = buildDisclosure(false)
    attach(root)
    click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(panel.hasAttribute('hidden')).toBe(false)
  })

  it('toggle: second click closes panel', () => {
    const { root, trigger, panel } = buildDisclosure(false)
    attach(root)
    click(trigger)
    click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(panel.hasAttribute('hidden')).toBe(true)
  })

  it('respects defaultOpen option', () => {
    const { root, trigger, panel } = buildDisclosure(false)
    attach(root, { defaultOpen: true })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(panel.hasAttribute('hidden')).toBe(false)
  })

  it('respects aria-expanded="true" on trigger as initial state', () => {
    const { root, trigger, panel } = buildDisclosure(true)
    attach(root)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(panel.hasAttribute('hidden')).toBe(false)
  })

  it('data-state attribute reflects panel open/closed state', () => {
    const { root, trigger, panel } = buildDisclosure(false)
    attach(root)
    expect(panel.getAttribute('data-state')).toBe('closed')
    click(trigger)
    expect(panel.getAttribute('data-state')).toBe('open')
    click(trigger)
    expect(panel.getAttribute('data-state')).toBe('closed')
  })
})
