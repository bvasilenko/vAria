
export function createEl(html: string): HTMLElement {
  const div = document.createElement('div')
  div.innerHTML = html.trim()
  document.body.appendChild(div)
  return div
}

export function cleanup(el: Element): void {
  el.remove()
}

export function press(target: EventTarget, key: string, extra: Partial<KeyboardEventInit> = {}): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra }))
}

export function click(target: EventTarget): void {
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
}
