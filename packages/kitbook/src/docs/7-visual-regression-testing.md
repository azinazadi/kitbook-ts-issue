# Visual Regression Testing

The simple [[3-component-variants|Variants]] format enables easy visual regression testing of all your components using [Playwright](https://playwright.dev/) and a GitHub action to post the results on your PR as seen [here](https://github.com/jacob-8/kitbook/pull/36#issuecomment-2072682316). 

*Note: This is not yet available for Compositions, and due to the slowness of browser rendering, a much faster option that relies on HTML diffing instead of pixel diffing is in the plans for Kitbook. Though the below solution will remain for those who really need the pixel diffing.*

## Install Playwright

```bash
pnpm install -D @playwright/test
```

## Create Snapshots Test File

This function will take your current version of [Playwright](https://playwright.dev/) and your ([[0-config|Kitbook config]]) to construct urls to each variant found in your `variants.ts` files. It snapshots each url for all your viewports (and [[8-i18n|languages]] if applicable). 

```ts title="e2e/kitbook.spec.ts"
import { getVariants, runComponentTests } from 'kitbook/test'
import { expect, test } from '@playwright/test'
import kitbookConfig from '../kitbook.config'

const variantModules = await getVariants()
runComponentTests({ test, expect, kitbookConfig, variantModules })
```

## Add Playwright config

If you don't already use Playwright the following [config](https://playwright.dev/docs/test-configuration) will get you started. Locally it uses your current dev server if already running, and if not it will start a dev server. On CI it will use the deployment preview url as the base url for the tests run in a GitHub action if you setup an action as described below in [[7-visual-regression-testing#GitHub Action]].

```ts title="playwright.config.ts"
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  snapshotDir: 'e2e/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{arg}-{projectName}-{platform}{ext}',
  fullyParallel: true,
  reporter: 'html',
  retries: 0, // important to keep at 0 as we are expecting "failures" for changed snapshots and don't want to produce multiple change snapshots for each retry
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
})
```

## Add to .gitignore

```txt title=".gitignore"
**/e2e/snapshots/*
playwright-report
test-results
```

## Add Test Commands

These script will run playwright against all test files with "kitbook" in the name which will just pick up our component tests. The first will update snapshots to create a base and the second will be used to compare against the base for changes.

```txt title="package.json"
"test:components:update": "playwright test kitbook --update-snapshots",
"test:components": "playwright test kitbook",
```

Now you can run these commands and see the test results.

The action below is assuming that you are just running your component snapshot tests, but with some simple adjustments you could also incorporate your other Playwright tests into the same test runs if
you're already using Playwright for e2e tests. However, do note that an easy way to keep them separate because of different settings or other conflicts is to create a custom playwright config file like `playwright.components.config.ts` and add the config flag to your script commands above, e.g. `--config playwright.components.config.ts`.

You may also enjoy using the Playwright UI runner locally by adding the `--ui` flag.

## Add Changed Snapshots as PR Comment

Next, setup a Google Cloud Storage bucket to store snapshots and add a GitHub action that will comment on your PR with changed snapshots on every push.

### Google Cloud Storage Bucket

[Create a new bucket](https://console.cloud.google.com/storage/create-bucket) using the standard storage class and uncheck `Enforce public access prevention on this bucket`. Then in your bucket go to the `Permissions` tab and add a new principal `allUsers` with the `Storage Object Viewer` role and save. This is described [here](https://cloud.google.com/storage/docs/access-control/making-data-public#buckets). 


Still in the Google Cloud Console, create a [service account](https://console.cloud.google.com/apis/credentials/serviceaccountkey) for your project with the `Storage Folder Admin` role. Then from that service account, create a service account key, download it as JSON, remove line breaks, and store it as a secret in your GitHub repo using `GCS_COMPONENT_CHECK_BUCKETS_CREDENTIALS` or something you consider more helpful.

### GitHub Action

The following action will use your recently created storage bucket along with Vercel deployment urls to comment on your PR with changed snapshots. Note each of the places pointed to with hands 👇 where you need to update using your own details.

```yaml title=".github/workflows/component-tests.yml"
name: Kitbook Visual Regression Tests

# Set all of these 👇
env:
  PLAYWRIGHT_BASE_URL: ${{ github.event.deployment_status.target_url }}
  UPDATE_SNAPSHOTS_SCRIPT: pnpm test:components:update
  COMPARE_SNAPSHOTS_SCRIPT: pnpm test:components
  GOOGLE_CLOUD_CREDENTIALS: ${{ secrets.GCS_COMPONENT_CHECK_BUCKETS_CREDENTIALS }} # 👈 saved as a secret in your repo
  BUCKET_NAME: my-snapshots
  PROJECT_NAME: foo
  PROJECT_ROOT: . # just a period for a root level project; in a monorepo this would be: ./packages/foo
  KITBOOK_ROUTE: kitbook # set this to a slash (/) if you use the root route

on:
  deployment_status

permissions:
  pull-requests: write

jobs:
  update-base-snapshots:
    name: Keep Base Component Snapshots In Sync with Main Branch
    if: github.event.deployment_status.state == 'success' && github.event.deployment_status.environment == 'Production – kitbook' # 👈 set this
    runs-on: ubuntu-latest
    timeout-minutes: 15
    container:
      image: mcr.microsoft.com/playwright:v1.43.1-jammy # 👈 keep version in sync with installed playwright package https://playwright.dev/docs/ci#github-actions-via-containers
    steps:
      - uses: actions/checkout@v3

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.6.0

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm

      - name: Install Dependencies
        run: pnpm install

      - name: Run Playwright Component tests to save snapshots
        run: eval $UPDATE_SNAPSHOTS_SCRIPT
        env:
          CI: true
          # PLAYWRIGHT_BASE_URL is set above already, otherwise it would need set here

      - name: Authenticate to Google Cloud
        id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: '${{ env.GOOGLE_CLOUD_CREDENTIALS }}'

      - name: Set up Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v1 # automatically picks up authentication from `auth`

      - name: Wipe Base Clean
        run: gcloud storage rm gs://${BUCKET_NAME}/${PROJECT_NAME}/base/**
        continue-on-error: true # ignore errors emitted when nothing is found to delete

      - name: Upload Base Snapshots
        run: gcloud storage cp --recursive ${PROJECT_ROOT}/e2e/snapshots gs://${BUCKET_NAME}/${PROJECT_NAME}/base/snapshots # 👈 recommend you setup your playwright.config.ts to save snapshots into $PROJECT_ROOT/e2e/snapshots to make this work smoothly (gcloud will create a base/snapshots folder if you just copy from e2e/snapshots to base, so if you tried to copy from e2e/foo to base/snapshots, I suspect things will land in base/snapshots/foo which will break things further on if you don't adjust) see https://cloud.google.com/sdk/gcloud/reference/storage for help if you do modify the commands

  compare-snapshots:
    name: Compare Components Against Base Snapshots
    if: github.event.deployment_status.state == 'success' && github.event.deployment_status.environment == 'Preview – kitbook' # 👈 set this
    runs-on: ubuntu-latest
    timeout-minutes: 15
    container:
      image: mcr.microsoft.com/playwright:v1.43.1-jammy # 👈 keep version in sync with installed playwright package https://playwright.dev/docs/ci#github-actions-via-containers

    steps:
      - uses: actions/checkout@v3

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.6.0

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm

      - name: Install Dependencies
        run: pnpm install

      - name: Authenticate to Google Cloud
        id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: '${{ env.GOOGLE_CLOUD_CREDENTIALS }}'

      - name: Set up Google Cloud SDK
        uses: google-github-actions/setup-gcloud@v1

      - name: Download Base Snapshots
        run: gcloud storage cp --recursive gs://${BUCKET_NAME}/${PROJECT_NAME}/base/snapshots ${PROJECT_ROOT}/e2e # 👈 recommend you setup your playwright.config.ts to save snapshots into $PROJECT_ROOT/e2e/snapshots to make this work smoothly

      - name: Run Playwright Component tests to get snapshot comparison files
        run: eval $COMPARE_SNAPSHOTS_SCRIPT
        env:
          CI: true
          # PLAYWRIGHT_BASE_URL is set above already, otherwise it would need set here
        continue-on-error: true # 👈 you expect an error when components change and this is ok, this does mean however that if you have a clear bill of health saying the no snapshots changed when they should have, you know there's a bug in your app keeping your tests from running, until there is a better process you will need to verify your logs

      - uses: jwalton/gh-find-current-pr@v1
        id: findPr

      - name: Remove Old Report and Test Results
        run: gcloud storage rm gs://${BUCKET_NAME}/${PROJECT_NAME}/pr/${{ steps.findPr.outputs.pr }}/**
        continue-on-error: true # ignore error emitted when nothing found to delete for this PR

      - name: Upload Playwright Report
        run: gcloud storage cp --recursive ${PROJECT_ROOT}/playwright-report gs://${BUCKET_NAME}/${PROJECT_NAME}/pr/${{ steps.findPr.outputs.pr }}/playwright-report
        continue-on-error: true # ignore error when no components have changed and there is no report

      - name: Upload Test Results (Snapshots)
        id: upload-snapshots
        uses: google-github-actions/upload-cloud-storage@v1 # use this instead of gcloud cli to easily output uploaded filenames
        with:
          path: '${{ env.PROJECT_ROOT }}/test-results'
          destination: '${{ env.BUCKET_NAME }}/${{ env.PROJECT_NAME }}/pr/${{ steps.findPr.outputs.pr }}'
        continue-on-error: true # ignore error when no components have changed and there is no report

      - name: Format Changed Component Snapshots for PR
        if: steps.findPr.outputs.number && steps.upload-snapshots.outputs.uploaded
        id: format_snapshot_links_for_pr
        uses: jacob-8/kitbook/packages/format-snapshot-results-action@v1 # 👈 use @v1 if you intend to keep up with Kitbook's beta updates until 1.0, but pin to a version (like @v1.0.0-beta.9) if you don't want to keep up with any possible breaking changes between beta and 1.0
        with:
          upload-results: '${{ steps.upload-snapshots.outputs.uploaded }}'
          pr: '${{ steps.findPr.outputs.pr }}'
          bucket: '${{ env.BUCKET_NAME }}'
          project: '${{ env.PROJECT_NAME }}'
          deployment-url: '${{ env.PLAYWRIGHT_BASE_URL }}'
          kitbook-route: '${{ env.KITBOOK_ROUTE }}'

      - name: Add Changed Component Snapshots to PR
        if: steps.findPr.outputs.number && steps.format_snapshot_links_for_pr.outputs.comment
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          number: ${{ steps.findPr.outputs.pr }}
          recreate: true
          header: ${{ env.PROJECT_NAME }}
          message: |
            ${{ steps.format_snapshot_links_for_pr.outputs.comment }}

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: ${{ env.PROJECT_ROOT }}/playwright-report/
          retention-days: 30
```

Snapshots will look slightly different on each platform, mainly because of font rendering differences, so know that comparisons don't work well across different types of devices (e.g. your PC vs colleagues' Mac). So just use the ones created in a Linux CI environment for comparisons.

**Great!** You've set up a completely free visual regression testing system for your components!

## Tips

### Skip Files

If you need to pass a Svelte component into a variant as a prop, you'll need to skip taking screenshots for that variants file as Playwright will choke when trying to import the Svelte file. You can pass an array of `skipFiles` (without extensions) like this:

```ts title="e2e/kitbook.spec.ts" {5-7,10}
import { expect, test } from '@playwright/test'
import { getVariants, runComponentTests } from 'kitbook/test'
import kitbookConfig from '../kitbook.config'

const skipFiles = [
  '/routes/foo/+page',
  '/lib/ui/Button',
]

const variantModules = await getVariants({ skipFiles })
runComponentTests({ test, expect, kitbookConfig, variantModules })
```

If you know a way to update Playwright's file parsing to handle imported Svelte files, please submit a PR. Or at least a way to ignore the Svelte file. That's not the data we need to run the tests. We only need file locations, variant names, viewports and languages.

### Turn off Vercel Comments

You may notice from time to time that the comment call-to-action button shows up in your snapshots. If you don't use Vercel comments, you can [turn off comments](https://vercel.com/docs/workflow-collaboration/comments/how-comments-work#at-the-account-level).

### Use $lib imports in variants

Sometimes its nice to use `$lib` imports when assembling your mock data for variants. You will need to specify your path aliases directly in your `tsconfig.json` and not the extended svelte config. Also add `baseUrl` [according to the Playwright docs](https://playwright.dev/docs/test-typescript#tsconfig-path-mapping):


```json title="tsconfig.json"
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    // ... other settings
    "paths": {
      "$lib": [
        "./src/lib"
      ],
      "$lib/*": [
        "./src/lib/*"
      ]
    },
    "baseUrl": "."
  }
}
```

### Compositions (not yet availabled)

Screenshotting compositions is not yet supported but it will be added. In the meantime, if you read the source code used for variants you could probably set it up yourself.

### Bucketless option

If you don't care about repo bloat (maybe you just have a small, personal project) and don't want to be bothered to set up cloud storage, you can store your baseline snapshots in your repo itself and rely on GitHub's visual diff viewer instead of a PR comment.

<details><summary>Expand to see how you could do it...</summary>

Update your test to clear snapshots before running tests so that stale images get cleared out for deleted variants.

```ts title="e2e/kitbook.spec.ts" {5}
import { clearSnapshots, getVariants, runComponentTests } from 'kitbook/test'
import { expect, test } from '@playwright/test'
import kitbookConfig from '../kitbook.config'

clearSnapshots()
const variantModules = await getVariants()
runComponentTests({ test, expect, kitbookConfig, variantModules })
```

Then use this workflow.

```yaml title=".github/workflows/component-tests.yml"
name: Kitbook Visual Regression Tests

# Set all of these 👇
env:
  PLAYWRIGHT_BASE_URL: ${{ github.event.deployment_status.target_url }}
  UPDATE_SNAPSHOTS_SCRIPT: pnpm test:components:update

on:
  deployment_status

permissions:
  contents: write
  pull-requests: write

jobs:
  update-snapshots:
    name: Update Component Snapshots
    if: github.event.deployment_status.state == 'success' &&  github.event.deployment_status.environment == 'Preview'
    # Can also use (github.event.deployment_status.environment == 'Production' || github.event.deployment_status.environment == 'Preview') if wanting to run again on the main branch but this is unneeded if you never push directly to the main branch
    runs-on: ubuntu-latest
    timeout-minutes: 15
    container:
      image: mcr.microsoft.com/playwright:v1.43.1-jammy # 👈 keep version in sync with installed package, https://playwright.dev/docs/ci#github-actions-via-containers

    steps:
      - name: Allow image commit and branch name extraction
        run: git config --system --add safe.directory /__w/kitbook/kitbook # 👈 change kitbook to the name of your repo (repo/repo, not owner/repo)

      - name: Get Branch
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
          ref: '${{ github.event.deployment_status.deployment.ref }}' # ref only needed if using the deployment_status trigger

      - name: Extract branch name # only needed if using the deployment_status trigger
        run: echo "GITHUB_BRANCH=$(git show -s --pretty=%D HEAD | tr -s ',' '\n' | sed 's/^ //' | grep -e 'origin/' | head -1 | sed 's/\origin\///g')" >> $GITHUB_OUTPUT
        id: extract_branch

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.6.0

      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: pnpm

      - name: Install Dependencies
        run: pnpm install

      - name: Run Playwright Component tests
        run: eval $UPDATE_SNAPSHOTS_SCRIPT
        env:
          CI: true
          # PLAYWRIGHT_BASE_URL is set above already, otherwise it would need set here

      - name: Commit Changed Component Snapshots If Changes Found
        uses: stefanzweifel/git-auto-commit-action@v4.16.0
        # if: github.event.deployment_status.environment != 'Production' # only needed if you push directly to the main branch
        with:
          commit_message: '[Updated Component Snapshots]' # 👈 you may want to update your auto-deployment service to ignore commits with this message
          branch: ${{ steps.extract_branch.outputs.GITHUB_BRANCH }} # only needed if using the deployment_status trigger

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

Then you will want to keep your deployment from redeploying when a commit is just to update snapshots. If using Vercel, you can set "Ignored Build Step" to "Run my Bash script" with `bash vercel-deploy.sh`, then add this file to your repo:

```bash title="vercel-deploy.sh"
#!/bin/bash

# Check if there are changes in the latest commit
git diff --quiet HEAD^ HEAD ./
HAS_CHANGES=$?

# Check if the commit message contains [Updated Component Snapshots]
git log -1 --pretty=%B | grep '\[Updated Component Snapshots\]'
HAS_IGNORE_MESSAGE=$?

echo "has changes is $HAS_CHANGES"
echo "has ignore is $HAS_IGNORE_MESSAGE"

if [ $HAS_CHANGES -eq 0 ] || [ $HAS_IGNORE_MESSAGE -eq 0 ]; then
  # Ignore the build
  echo "🛑 - Build cancelled"
  exit 0
else
  echo "✅ - Build can proceed"
  exit 1
fi
```

This workflow will not be maintained as using cloud storage is the better option, but if you find it helpful and have some improvement to it, feel free to submit a PR.

</details>

## Test Component Interactions

Learn how to add [[7a-additional-component-tests]] beyond simple snapshots.



[//begin]: # "Autogenerated link references for markdown compatibility"
[3-component-variants|Variants]: 3-component-variants.md "Component Variants"
[0-config|Kitbook config]: 3-customizations/0-config.md "Kitbook Config"
[8-i18n|languages]: 8-i18n.md "i18n"
[7-visual-regression-testing#GitHub Action]: 7-visual-regression-testing.md "Visual Regression Testing"
[7a-additional-component-tests]: 7a-additional-component-tests.md "Addtional Component Tests"
[//end]: # "Autogenerated link references"