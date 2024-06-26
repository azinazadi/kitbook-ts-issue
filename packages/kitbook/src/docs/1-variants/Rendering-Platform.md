# Rendering Platform

In addition to the ability to toggle client-side rendering (CSR) on and off when viewing variants and compositions, you can also permanently set a variant or composition to only render on the server or only on the client. Kitbook's [[Viewer]] is an example of a client only component.

## SSR or CSR Only Composition

```svelte title="Foo.composition"
<script context="module" lang="ts">
  import { defineComposition } from 'kitbook'

  export const config = defineComposition({
    // ssr: false // - use this for only client-side rendering, but don't do both
    csr: false, // - use this for only server-side rendering
  })
</script>
```

## SSR or CSR Only Variant

```ts title="Greeting.variants.ts"
import type { Variant } from 'kitbook'
import type Component from './Foo.svelte'

export const SSR: Variant<Component> = {
  _meta: {
    ssr: false // - use this for only client-side rendering, but don't do both
    // csr: false, // - use this for only server-side rendering
  }
}
```

Even though components that don't hydrate on the client (SSR-only) usually can't have HMR, Kitbook will automatically reload an SSR-only composition or variant on every change.

---

Note that by default the Playwright version of [[7-visual-regression-testing]] will automatically be run against SSR only unless you specify the `_meta.tests.clientSideRendered` option to `true` on a variant.

[//begin]: # "Autogenerated link references for markdown compatibility"
[Viewer]: ../../lib/viewer/Viewer.md "Viewer"
[7-visual-regression-testing]: ../7-visual-regression-testing.md "Visual Regression Testing"
[//end]: # "Autogenerated link references"