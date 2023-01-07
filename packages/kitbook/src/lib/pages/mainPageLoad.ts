import type { SvelteComponent } from 'svelte';
import type { GroupedPage, LoadedModules, Variants } from '../kitbook-types';

export const mainPageLoad = async ({ params, parent }) => {
    const { pages } = await parent();
    const pageKey = '/' + params.file;
    const page: GroupedPage = pages[pageKey];
    const loadedModules: LoadedModules = {}

    if (page) {
        if (page.loadSvx) {
            loadedModules.svx = (await page.loadSvx.loadModule())?.default as typeof SvelteComponent;
        }
        if (page.loadComponent) {
            loadedModules.component = (await page.loadComponent.loadModule())?.default as typeof SvelteComponent;
        }
        if (page.loadVariants) {
            loadedModules.variants = (await page.loadVariants.loadModule())?.variants as Variants<any>;
        }
        return { page, pageKey, loadedModules };
    }

    const indexPage = pages['/index'] as GroupedPage;
    if (indexPage) {
        loadedModules.svx = (await indexPage.loadSvx.loadModule() as any)?.default as typeof SvelteComponent
        return { page: indexPage, pageKey: '/index', loadedModules };
    }

    const readmePage = pages['/README'] as GroupedPage;
    if (readmePage) {
        try {
            loadedModules.svx = (await readmePage.loadSvx.loadModule() as any)?.default as typeof SvelteComponent
            return { page: readmePage, pageKey: '/README', loadedModules };
        } catch (e) {
            return {
                error: `Displaying your project README.md as the Kitbook homepage will only work if you allow the Vite server to access one level up from project root (/src) by setting "server.fs.allow = ['..']" in your Vite config. You must have changed the Kitbook default. See https://vitejs.dev/config/#server-fs-allow for more info. // ERROR: ${e}`
            };
        }
    }

    return { error: 'No modules found for this route. By default Kitbook will try to display your project README.md file as the home page if no src/index.md file exists.' };
};
