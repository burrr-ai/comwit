/**
 * Custom Oxlint rules using its ESLint-compatible JavaScript plugin API.
 */

const authHydrationBoundary = require('./auth-hydration-boundary.cjs');
const stateStructure = require('./state-structure.cjs');
const apiStructure = require('./api-structure.cjs');
const appStructure = require('./app-structure.cjs');
const serverActions = require('./server-actions.cjs');
const pageUseClient = require('./page-use-client.cjs');
const noUseClientInApp = require('./no-use-client-in-app.cjs');
const noDirectComwitImport = require('./no-direct-comwit-import.cjs');
const clientComponentNoApiImport = require('./client-component-no-api-import.cjs');
const noNextImage = require('./no-next-image.cjs');
const noAnchorTag = require('./no-anchor-tag.cjs');
const noNativeInteractive = require('./no-native-interactive.cjs');
const kebabCaseFilename = require('./kebab-case-filename.cjs');
const noMultipleStateHookCalls = require('./no-multiple-state-hook-calls.cjs');
const indexOnlyImport = require('./index-only-import.cjs');
const apiOnlyServerAction = require('./api-only-server-action.cjs');
const noPageMockImport = require('./no-page-mock-import.cjs');
const noRootAppFolder = require('./no-root-app-folder.cjs');
const noDbInApi = require('./no-db-in-api.cjs');
const serverOnlyImport = require('./server-only-import.cjs');
const apiCreateAction = require('./api-create-action.cjs');
const apiActionError = require('./api-action-error.cjs');
const betterAuthRequiredOptions = require('./better-auth-required-options.cjs');
const noDirectApiActionImport = require('./no-direct-api-action-import.cjs');
const drizzleNodeConfig = require('./drizzle-node-config.cjs');

module.exports = {
  rules: {
    'auth-hydration-boundary': authHydrationBoundary,
    'drizzle-node-config': drizzleNodeConfig,
    'state-structure': stateStructure,
    'api-structure': apiStructure,
    'app-structure': appStructure,
    'server-actions': serverActions,
    'page-use-client': pageUseClient,
    'no-use-client-in-app': noUseClientInApp,
    'no-direct-comwit-import': noDirectComwitImport,
    'client-component-no-api-import': clientComponentNoApiImport,
    'no-next-image': noNextImage,
    'no-anchor-tag': noAnchorTag,
    'no-native-interactive': noNativeInteractive,
    'kebab-case-filename': kebabCaseFilename,
    'no-multiple-state-hook-calls': noMultipleStateHookCalls,
    'index-only-import': indexOnlyImport,
    'api-only-server-action': apiOnlyServerAction,
    'no-page-mock-import': noPageMockImport,
    'no-root-app-folder': noRootAppFolder,
    'no-db-in-api': noDbInApi,
    'server-only-import': serverOnlyImport,
    'api-create-action': apiCreateAction,
    'api-action-error': apiActionError,
    'better-auth-required-options': betterAuthRequiredOptions,
    'no-direct-api-action-import': noDirectApiActionImport,
  },
};
