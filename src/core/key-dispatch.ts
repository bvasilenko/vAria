// SPDX-License-Identifier: MIT
// Copyright (c) 2026 bvasilenko

export type KeyHandler = (event: KeyboardEvent) => void

export type KeyMap = Partial<Record<string, KeyHandler>>

export interface KeyDispatcher {
  readonly dispose: () => void
}

export function onKey(
  target: EventTarget,
  keymap: KeyMap,
  options: { capture?: boolean } = {},
): KeyDispatcher {
  function handleKeydown(event: Event): void {
    const ke = event as KeyboardEvent
    const handler = keymap[ke.key]
    if (handler) {
      handler(ke)
    }
  }

  target.addEventListener('keydown', handleKeydown, { capture: options.capture ?? false })

  return {
    dispose() {
      target.removeEventListener('keydown', handleKeydown, { capture: options.capture ?? false })
    },
  }
}

export function onKeyPreventDefault(
  target: EventTarget,
  keymap: KeyMap,
  options: { capture?: boolean } = {},
): KeyDispatcher {
  const wrappedKeymap = Object.fromEntries(
    Object.entries(keymap).map(([key, handler]) => [
      key,
      (event: KeyboardEvent) => {
        event.preventDefault()
        handler?.(event)
      },
    ]),
  ) as KeyMap

  return onKey(target, wrappedKeymap, options)
}
