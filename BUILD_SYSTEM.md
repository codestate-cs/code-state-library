# CodeState Build System

This project now supports a dual-package build system that creates both the CLI package and a separate types package simultaneously.

## Build Outputs

### 1. CLI Package (`codestate`)
- **Location**: `dist/`
- **Purpose**: The main CLI executable and API functions
- **Files**:
  - `index.js` - CLI executable
  - `api.js` - API functions for external consumption
  - `package.json` - CLI package manifest

### 2. Types Package (`@types/codestate`)
- **Location**: `dist-types/`
- **Purpose**: Comprehensive TypeScript type definitions
- **Files**:
  - `index.d.ts` - Main type declarations
  - `api.d.ts` - API type declarations
  - `package.json` - Types package manifest

## Build Commands

### Build Both Packages (Default)
```bash
npm run build
```
Creates both the CLI package and types package simultaneously.

### Build CLI Package Only
```bash
npm run build:cli
```
Creates only the CLI package in `dist/`.

### Build Types Package Only
```bash
npm run build:types
```
Creates only the types package in `dist-types/`.

### Watch Mode
```bash
npm run build:watch
```
Builds both packages and watches for changes.

## Publishing

### Publish CLI Package
```bash
npm run publish:cli
```
Builds and publishes the CLI package to npm.

### Publish Types Package
```bash
npm run publish:types
```
Builds and publishes the types package to npm.

### Publish Both Packages
```bash
npm run publish:all
```
Builds and publishes both packages to npm.

## Usage in IDE Projects

### Before (Problematic)
The IDE project had hardcoded paths in `tsconfig.json`:
```json
{
  "paths": {
    "codestate/*": ["C:/Users/KARTH/AppData/Roaming/npm/node_modules/codestate/*"]
  }
}
```

### After (Clean Solution)
1. Install the types package as a dev dependency:
```bash
npm install --save-dev @types/codestate
```

2. Remove the hardcoded path mapping from `tsconfig.json`

3. Use standard imports:
```typescript
import { SaveSession, Session } from 'codestate/api';
```

## Benefits

1. **Portable**: Works on any machine without hardcoded paths
2. **Type Safety**: Comprehensive TypeScript definitions
3. **Standard Approach**: Follows TypeScript community conventions
4. **Clean Separation**: Types are in their own package
5. **Version Control**: Can version types independently
6. **IDE Support**: Better IntelliSense and autocomplete

## Build Process

1. **CLI Build**: Uses esbuild to bundle the CLI and API
2. **Types Generation**: Uses TypeScript compiler to generate comprehensive declarations
3. **Fallback**: If TypeScript compilation fails, creates comprehensive type declarations manually
4. **Package Creation**: Copies appropriate package.json files to output directories

## File Structure

```
code-state-v2/
├── dist/                    # CLI package
│   ├── index.js            # CLI executable
│   ├── api.js              # API functions
│   └── package.json        # CLI manifest
├── dist-types/             # Types package
│   ├── index.d.ts          # Main types
│   ├── api.d.ts            # API types
│   └── package.json        # Types manifest
├── dist-package.json       # CLI package template
├── dist-types-package.json # Types package template
└── esbuild.config.js       # Build configuration
```

## Troubleshooting

### TypeScript Errors During Build
The build process may show TypeScript errors in the source code, but these don't prevent the build from completing. The build system includes a fallback mechanism that creates comprehensive type declarations even if the TypeScript compiler fails.

### Missing Types
If you need additional types, they can be added to the fallback type declarations in `esbuild.config.js` under the `comprehensiveTypes` variable. 