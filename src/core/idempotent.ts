
export type Disposer = () => void

const attached = new WeakMap<Element, Disposer>()

export function guardIdempotent(
  root: Element,
  init: () => Disposer,
): Disposer {
  const existing = attached.get(root)
  if (existing) return existing

  const disposer = init()
  const wrappedDisposer: Disposer = () => {
    disposer()
    attached.delete(root)
  }

  attached.set(root, wrappedDisposer)
  return wrappedDisposer
}
