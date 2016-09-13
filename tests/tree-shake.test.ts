
import { describe, it, expect } from 'vitest'

describe('tree-shake: entry isolation', () => {
  it('dialog entry exports only attach', async () => {
    const mod = await import('../src/entries/dialog.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('accordion entry exports only attach', async () => {
    const mod = await import('../src/entries/accordion.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('tabs entry exports only attach', async () => {
    const mod = await import('../src/entries/tabs.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('combobox entry exports only attach', async () => {
    const mod = await import('../src/entries/combobox.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('tooltip entry exports only attach', async () => {
    const mod = await import('../src/entries/tooltip.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('alert entry exports only attach', async () => {
    const mod = await import('../src/entries/alert.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('disclosure entry exports only attach', async () => {
    const mod = await import('../src/entries/disclosure.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('menu entry exports only attach', async () => {
    const mod = await import('../src/entries/menu.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('menubutton entry exports only attach', async () => {
    const mod = await import('../src/entries/menubutton.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('listbox entry exports only attach', async () => {
    const mod = await import('../src/entries/listbox.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('switch entry exports only attach', async () => {
    const mod = await import('../src/entries/switch.js')
    expect(Object.keys(mod)).toEqual(['attach'])
  })

  it('core entry does not export pattern attach functions', async () => {
    const mod = await import('../src/entries/core.js')
    const keys = Object.keys(mod)
    expect(keys).not.toContain('dialog')
    expect(keys).not.toContain('accordion')
    expect(keys).not.toContain('tabs')
    expect(keys).toContain('createFocusTrap')
    expect(keys).toContain('createRovingTabindex')
    expect(keys).toContain('onKey')
    expect(keys).toContain('guardIdempotent')
  })
})
