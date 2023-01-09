# Get Started: How to Create a KitBook

**Warning: This is alpha software and not ready.** Watch the updating [[4-roadmap]] for clues on when that will be.

- Install the `kitbook` package: `npm i -D kitbook@alpha` or `pnpm add -D kitbook@alpha`

- Add the `kitbook()` Vite plugin *before* your `sveltekit()` plugin:
```js title="vite.config.js" {2,6}
import { sveltekit } from '@sveltejs/kit/vite';
import { kitbook } from 'kitbook/plugins/vite';

const config = {
	plugins: [
		kitbook(),
		sveltekit(),
	],
};

export default config;
```

- Add these scripts to your `package.json`:
```json
"kitbook": "vite dev --mode kitbook",
"kitbook:build": "vite build --mode kitbook",
"kitbook:preview": "vite preview --mode kitbook",
```

- Run `npm kitbook` or `pnpm kitbook`
 
- Kitbook will quickly [[1-use-kitbook-by-itself-(for-a-library)#Understand Kitbook's Initialization|initialize]], and then you will want to **add an asterisk** to `/.svelte-kit` in your `.gitignore` file to modify it to `/.svelte-kit*` so the `/.svelte-kit-kitbook` folder isn't committed.

At this point you can open Kitbook and see all your Svelte components, *including `+page.svelte` and `+layout.svelte` files as they are also just plain Svelte components with a very important `data` prop*.
 
Next you could...

- [[2-write-documentation.md]]
- [[3-add-stories]] 
- [[4-add-component-variants]] 

[//begin]: # "Autogenerated link references for markdown compatibility"
[4-roadmap]: 9-maintainer-notes/4-roadmap "Roadmap"
[1-use-kitbook-by-itself-(for-a-library)#Understand Kitbook's Initialization|initialize]: 3-customizations/1-use-kitbook-by-itself-(for-a-library) "Use Kitbook by Itself"
[2-write-documentation.md]: 2-write-documentation "Write Documentation"
[3-add-stories]: 3-add-stories "Add Stories"
[4-add-component-variants]: 4-add-component-variants "Add Component Variants"
[//end]: # "Autogenerated link references"