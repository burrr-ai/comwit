/**
 * ESLint rule to enforce comwit state domain folder structure
 *
 * Required structure for src/state/{domain}/:
 *   ├── types.ts         # State, Actions, API types
 *   ├── model.ts         # comwit model definition
 *   ├── index.ts         # Must re-export from ./types and import ./model
 *   └── actions/         # Action files (e.g., *.ts)
 */

const fs = require("fs");
const path = require("path");

const REQUIRED_FILES = ["types.ts", "model.ts"];
const REQUIRED_DIRS = ["actions"];

// Forbidden domains - these should be handled by other domains
const FORBIDDEN_DOMAINS = {
  auth: "Use state/user instead. Auth actions belong in state/user/actions/auth.ts",
};

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce comwit state domain structure",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      forbiddenDomain: 'State domain "{{domain}}" is forbidden. {{reason}} (see src/services/state.ai.md)',
      missingFile: 'State domain "{{domain}}" is missing required file: {{file}} (see src/services/state.ai.md)',
      missingDir: 'State domain "{{domain}}" is missing required directory: {{dir}} (see src/services/state.ai.md)',
      emptyActionsDir:
        'State domain "{{domain}}" has empty actions directory - add at least one action file (see src/services/state.ai.md)',
      missingTypesExport:
        "State domain \"{{domain}}\" index.ts must re-export from ./types (add: export * from './types') (see src/services/state.ai.md)",
      missingModelImport:
        'State domain "{{domain}}" index.ts must import from ./model (see src/services/state.ai.md)',
    },
    schema: [],
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    const normalizedPath = filename.replace(/\\/g, "/");
    const stateMatch = normalizedPath.match(/src\/services\/[^/]+\/state\/([^/]+)\/index\.ts$/);
    if (!stateMatch) return {};

    const domain = stateMatch[1];
    if (domain.startsWith(".")) return {};

    if (FORBIDDEN_DOMAINS[domain]) {
      return {
        Program(node) {
          context.report({
            node,
            messageId: "forbiddenDomain",
            data: { domain, reason: FORBIDDEN_DOMAINS[domain] },
          });
        },
      };
    }

    const domainPath = path.dirname(filename);
    let hasTypesExport = false;
    let hasModelImport = false;

    return {
      ImportDeclaration(node) {
        if (node.source && node.source.value === "./model") {
          hasModelImport = true;
        }
      },
      ExportAllDeclaration(node) {
        if (node.source && node.source.value === "./types") {
          hasTypesExport = true;
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source && node.source.value === "./types") {
          hasTypesExport = true;
        }
      },
      "Program:exit"(node) {
        // Check required files
        for (const file of REQUIRED_FILES) {
          const filePath = path.join(domainPath, file);
          if (!fs.existsSync(filePath)) {
            context.report({
              node,
              messageId: "missingFile",
              data: { domain, file },
            });
          }
        }

        for (const dir of REQUIRED_DIRS) {
          const dirPath = path.join(domainPath, dir);
          if (!fs.existsSync(dirPath)) {
            context.report({
              node,
              messageId: "missingDir",
              data: { domain, dir },
            });
          } else {
            // Check if actions directory has at least one .ts file
            try {
              const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".ts"));
              if (files.length === 0) {
                context.report({
                  node,
                  messageId: "emptyActionsDir",
                  data: { domain },
                });
              }
            } catch (error) {
              // Directory read failed, skip
            }
          }
        }

        if (!hasTypesExport) {
          context.report({
            node,
            messageId: "missingTypesExport",
            data: { domain },
          });
        }

        if (!hasModelImport) {
          context.report({
            node,
            messageId: "missingModelImport",
            data: { domain },
          });
        }
      },
    };
  },
};
