# Viewer

![edit-props-in-viewer](https://github.com/jacob-8/kitbook/assets/7559478/5edf0048-6fcb-49a0-afc3-83dbad64a624)

In dev mode you can press `alt+shift` to open the Kitbook Viewer. It works similar to the Svelte Inspector in that you can left-click on a component to jump to editing it in VS Code. But if you right-click you can:

- edit current component props
- view component variants (and compositions soon)
- easily create a new variants or documentation for a component if you don't have one yet
- and much more planned.

With Kitbook added to your app and your dev server running, try activating the Viewer using that customizable keyboard shortcut and selecting one of your components that you'd like to create variants for. Click the `Add Variant from Current State` button (this will be more interesting if you choose a component with props) and you should find yourself in VSCode with a new file. If you selected a component named `Button.svelte` for example, you'll now see yourself looking at a file named `Button.variants.ts`. You'll notice it has one variant using the current props of the component you just clicked on. Now you probably want to continue on to learn more about [[3-component-variants]].


[//begin]: # "Autogenerated link references for markdown compatibility"
[3-component-variants]: 3-component-variants.md "Component Variants"
[//end]: # "Autogenerated link references"