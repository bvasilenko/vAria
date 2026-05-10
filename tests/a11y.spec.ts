// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const bundle = readFileSync(resolve(process.cwd(), 'dist/all.iife.js'), 'utf-8')

type PatternFixture = { markup: string; selector: string }

const PATTERNS: Record<string, PatternFixture> = {
  dialog: {
    selector: '[data-v-pattern="dialog"]',
    markup: `
      <div data-v-pattern="dialog">
        <h2>Dialog Title</h2>
        <p>Dialog body content.</p>
        <button data-dialog-close>Close</button>
      </div>`,
  },
  accordion: {
    selector: '[data-v-pattern="accordion"]',
    markup: `
      <div data-v-pattern="accordion">
        <div data-accordion-item>
          <h3><button data-accordion-trigger>Section One</button></h3>
          <div data-accordion-panel>Content for section one.</div>
        </div>
        <div data-accordion-item>
          <h3><button data-accordion-trigger>Section Two</button></h3>
          <div data-accordion-panel hidden>Content for section two.</div>
        </div>
      </div>`,
  },
  tabs: {
    selector: '[data-v-pattern="tabs"]',
    markup: `
      <div data-v-pattern="tabs">
        <div data-tablist>
          <button data-tab aria-selected="true">Tab A</button>
          <button data-tab>Tab B</button>
        </div>
        <div data-tabpanel>Panel A content.</div>
        <div data-tabpanel hidden>Panel B content.</div>
      </div>`,
  },
  combobox: {
    selector: '[data-v-pattern="combobox"]',
    markup: `
      <div data-v-pattern="combobox">
        <label for="fruit-input">Fruit</label>
        <input id="fruit-input" type="text" placeholder="Choose a fruit">
        <ul id="fruit-listbox" role="listbox" hidden>
          <li data-option data-value="Apple">Apple</li>
          <li data-option data-value="Banana">Banana</li>
          <li data-option data-value="Cherry">Cherry</li>
        </ul>
      </div>`,
  },
  tooltip: {
    selector: '[data-v-pattern="tooltip"]',
    markup: `
      <div data-v-pattern="tooltip">
        <button data-tooltip-trigger>More information</button>
        <span data-tooltip-content>Helpful descriptive text for this action.</span>
      </div>`,
  },
  alert: {
    selector: '[data-v-pattern="alert"]',
    markup: `
      <div data-v-pattern="alert">
        Your session will expire in 5 minutes.
      </div>`,
  },
  disclosure: {
    selector: '[data-v-pattern="disclosure"]',
    markup: `
      <div data-v-pattern="disclosure">
        <button data-disclosure-trigger>Show advanced options</button>
        <div data-disclosure-panel>Advanced options content revealed on click.</div>
      </div>`,
  },
  menu: {
    selector: '[data-v-pattern="menu"]',
    markup: `
      <div data-v-pattern="menu">
        <div data-menu-item>Edit document</div>
        <div data-menu-item>Copy link</div>
        <div data-menu-item>Delete item</div>
      </div>`,
  },
  menubutton: {
    selector: '[data-v-pattern="menubutton"]',
    markup: `
      <div data-v-pattern="menubutton">
        <button data-menubutton-trigger>Actions</button>
        <div data-menu hidden>
          <div data-menu-item>Edit</div>
          <div data-menu-item>Delete</div>
        </div>
      </div>`,
  },
  listbox: {
    selector: '[data-v-pattern="listbox"]',
    markup: `
      <div data-v-pattern="listbox" aria-label="Choose a fruit">
        <div data-option data-value="apple">Apple</div>
        <div data-option data-value="banana">Banana</div>
        <div data-option data-value="cherry">Cherry</div>
      </div>`,
  },
  switch: {
    selector: '[data-v-pattern="switch"]',
    markup: `
      <div data-v-pattern="switch">
        <button data-switch>Dark mode</button>
      </div>`,
  },
}

function pageHtml(patternMarkup: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>a11y test</title></head>
<body>
<main>
  <section data-testid="root">
    ${patternMarkup}
  </section>
</main>
</body>
</html>`
}

for (const [name, { markup, selector }] of Object.entries(PATTERNS)) {
  test(`axe: zero violations — ${name}`, async ({ page }) => {
    await page.setContent(pageHtml(markup))
    await page.addScriptTag({ content: bundle })
    await page.waitForSelector(selector)

    const results = await new AxeBuilder({ page })
      .include('[data-testid="root"]')
      .analyze()

    expect(
      results.violations,
      `Pattern "${name}" has axe violations:\n` +
        results.violations.map((v) => `  [${v.id}] ${v.description}`).join('\n'),
    ).toEqual([])
  })
}
