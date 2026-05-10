// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const bundle = readFileSync(resolve(process.cwd(), 'dist/all.iife.js'), 'utf-8')

test('bundle exposes vAria.attach as a function on window', async ({ page }) => {
  await page.setContent('<html lang="en"><body></body></html>')
  await page.addScriptTag({ content: bundle })
  const hasAttach = await page.evaluate(() => typeof (window as Record<string, unknown> & Window)['vAria'] !== 'undefined' &&
    typeof (window as Record<string, unknown> & Window & { vAria: { attach: unknown } })['vAria']['attach'] === 'function')
  expect(hasAttach).toBe(true)
})

test('auto-attach wires data-v-pattern elements present at script load', async ({ page }) => {
  await page.setContent(`
    <html lang="en">
    <body>
      <div data-v-pattern="alert" id="target">Session expiring.</div>
    </body>
    </html>`)
  await page.addScriptTag({ content: bundle })
  const role = await page.locator('#target').getAttribute('role')
  expect(role).toBe('alert')
})

test('vAria.attach(container) wires data-v-pattern descendants of the container', async ({ page }) => {
  await page.setContent('<html lang="en"><body><div id="app"></div></body></html>')
  await page.addScriptTag({ content: bundle })
  const result = await page.evaluate(() => {
    const app = document.getElementById('app') as HTMLElement
    app.innerHTML = `
      <div data-v-pattern="alert" id="a1">Alert A</div>
      <div data-v-pattern="alert" id="a2">Alert B</div>`
    const dispose = (window as Window & { vAria: { attach: (el: Element) => () => void } }).vAria.attach(app)
    const roleBefore = [
      document.getElementById('a1')?.getAttribute('role'),
      document.getElementById('a2')?.getAttribute('role'),
    ]
    dispose()
    const roleAfter = [
      document.getElementById('a1')?.getAttribute('role'),
      document.getElementById('a2')?.getAttribute('role'),
    ]
    return { roleBefore, roleAfter }
  })
  expect(result.roleBefore).toEqual(['alert', 'alert'])
  expect(result.roleAfter).toEqual([null, null])
})

test('vAria.attach() with no argument uses document.documentElement as root', async ({ page }) => {
  await page.setContent('<html lang="en"><body><div id="app"></div></body></html>')
  await page.addScriptTag({ content: bundle })
  const role = await page.evaluate(() => {
    const el = document.createElement('div')
    el.setAttribute('data-v-pattern', 'alert')
    el.id = 'dynamic'
    document.body.appendChild(el)
    const dispose = (window as Window & { vAria: { attach: () => () => void } }).vAria.attach()
    const r = document.getElementById('dynamic')?.getAttribute('role')
    dispose()
    el.remove()
    return r
  })
  expect(role).toBe('alert')
})
