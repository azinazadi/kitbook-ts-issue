# Component Compositions

When you're prototyping and documentation needs go beyond simply passing props and context you can use Compositions. From any Kitbook page documenting a Svelte component, you can click the "Add Composition" button to create a new composition file. This will create a new file with the same name as the component you're documenting, but with the `composition` extension instead of `svelte`. For example, if you're documenting `MyComponent.svelte`, the first composition file will be `MyComponent.composition`. If you want to create further compositions, click the button again and provide a name. If you choose `foo`, the file will be `MyComponent.foo.composition`. Here's a really plain example:

[[4-component-compositions.composition]]

You can also create a Composition beside a corresponding markdown documentation page as you see in [[complex-examples]] (look at the source code) - just click the `Add Composition` button when viewing your markdown page.

This Kitbook's [[SearchResult]] page has a simple Composition you could peak at.

## Extension Support

To get these files with the `.composition` extension to work like Svelte files, you'll need to update the extensions property in your svelte config:

```js twoslash title="svelte.config.js" {2}
const config = {
  extensions: ['.svelte', '.composition'],
  // ...
}

export default config
```

And add this VSCode setting:

```json title=".vscode/settings.json"
{
  "files.associations": {
    "*.composition": "svelte"
  }
}
```

Add the extension to eslint like this in a fresh project:

```js twoslash title=".eslintrc.cjs" {6}
module.exports = {
  overrides: [
    {
      files: [
        '*.svelte',
        '*.composition',
      ]
      // ...
    }
  ]
}
```

If you find yourself wrestling with Prettier, I recommend using [`@antfu/eslint-config`](https://github.com/antfu/eslint-config) and ESLint's flat config for both linting and formatting. See Kitbook's own [`eslint.config.js`](https://github.com/jacob-8/kitbook/blob/main/eslint.config.js) for a thorough example that has Typescript and Svelte support, but here's a basic starter:

```js twoslash title="eslint.config.js" {6,9}
import { antfu } from '@antfu/eslint-config'

export default antfu({ svelte: true })
  .overrides({
    'antfu/typescript/rules': {
      files: ['**/*.svelte', '**/*.composition'],
    },
    'antfu/svelte/rules': {
      files: ['**/*.composition'],
    },
  })
```

---

Now that you have a composition in place, learn how to [[5-write-documentation|document your components]], including sprinkling in compositions where helpful.

[//begin]: # "Autogenerated link references for markdown compatibility"
[4-component-compositions.composition]: 4-component-compositions.composition "4-component-compositions"
[complex-examples]: 2-compositions/complex-examples.md "Advanced Composition Use Cases"
[SearchResult]: ../lib/layout/sidebar/search/SearchResult.md "SearchResult"
[5-write-documentation|document your components]: 5-write-documentation.md "Write Documentation"
[//end]: # "Autogenerated link references"
