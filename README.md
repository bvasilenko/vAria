# vAria

ARIA behavior layer. Per-pattern `attach(root) => dispose` — focus traps, roving tabindex, keyboard wiring, role/state management. APG-conformant. DOM only, zero runtime deps. Works in vanilla pages, SSG output, React apps.

```ts
import { attach } from '@booga/varia/dialog'

const dispose = attach(document.getElementById('my-dialog'))
// later:
dispose()
```

## Patterns

`dialog` · `accordion` · `tabs` · `combobox` · `tooltip` · `alert` · `disclosure` · `menu` · `menubutton` · `listbox` · `switch`

## Auto-attach

```html
<script src="https://cdn.jsdelivr.net/npm/@booga/varia/dist/all.iife.js"></script>
<div data-v-pattern="dialog" ...>...</div>
```

## Install

```sh
npm install @booga/varia
```

## Contributing

Please read and follow our [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## License

MIT © 2026 bvasilenko
