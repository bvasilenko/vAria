// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

import { defineConfig } from 'tsup'

const PATTERNS = [
  'dialog',
  'accordion',
  'tabs',
  'combobox',
  'tooltip',
  'alert',
  'disclosure',
  'menu',
  'menubutton',
  'listbox',
  'switch',
] as const

const moduleEntries = Object.fromEntries([
  ['index', 'src/entries/index.ts'],
  ['core', 'src/entries/core.ts'],
  ['all', 'src/entries/all.ts'],
  ...PATTERNS.map((p) => [p, `src/entries/${p}.ts`]),
])

const iifeEntries = {
  all: 'src/entries/all.ts',
}

export default defineConfig([
  {
    entry: moduleEntries,
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
  },
  {
    entry: iifeEntries,
    format: ['iife'],
    globalName: 'vAria',
    outExtension: () => ({ js: '.iife.js' }),
    splitting: false,
    sourcemap: false,
    clean: false,
    minify: false,
    treeshake: true,
  },
])
