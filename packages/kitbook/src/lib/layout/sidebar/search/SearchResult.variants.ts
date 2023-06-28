import type { Variants } from 'kitbook';
import type Component from './SearchResult.svelte';
export const variants: Variants<Component> = [
  {
    name: 'README',
    height: 100,
    props: {
      page: {
        "extensions": [
          "md",
        ],
        "name": "README",
        "path": "/README.md",
        "url": "/README",
      }
    },
  },
  {
    name: 'README (active)',
    height: 100,
    props: {
      page: {
        "extensions": [
          "md",
        ],
        "name": "README",
        "path": "/README.md",
        "url": "/README",
      },
      active: true,
    },
  },
  {
    name: 'doc (active)',
    height: 100,
    props: {
      page: {
        "extensions": [
          "md",
        ],
        "name": "why kitbook",
        "path": "/src/docs/0-why-kitbook.md",
        "url": "/docs/0-why-kitbook",
      },
      active: true,
    },
  },
  {
    name: 'component with story and variants',
    height: 100,
    props: {
      page: {
        "extensions": [
          "svelte",
          "md",
          "variants.ts",
        ],
        "name": "Button",
        "path": "/src/lib/a/Button.svelte",
        "url": "/lib/a/Button",
      },
    },
  },
]