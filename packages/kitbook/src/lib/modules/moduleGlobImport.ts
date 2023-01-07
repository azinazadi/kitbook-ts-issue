import { groupColocatedModulesIntoPages } from "../layout/parseModules/groupColocatedModulesIntoPages";
import { pagesStore } from "./hmrUpdatedModules";

// Vite reference: https://vitejs.dev/guide/features.html#glob-import
const modules = import.meta.glob(['/src/**/*.{md,svx,svelte,variants.ts}', '/README.md']);
// export const modulesRaw = import.meta.glob(['/src/**/*.{md,svx,svelte,variants.ts}', '/README.md'], { as: 'raw' });

export const pages = groupColocatedModulesIntoPages(modules);

// pagesStore.set(pages); // optional to switch right from SSR to Client loaded modules

if (import.meta.hot) {
  import.meta.hot.accept((moduleGlobImport_module) => {
    if (moduleGlobImport_module?.pages) {
      pagesStore.set(moduleGlobImport_module.pages);
      console.log('accepted updated modules')
    }
  })
}
