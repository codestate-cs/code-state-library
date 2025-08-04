import { build } from 'esbuild';
import { copyFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync, readdirSync, unlinkSync as unlinkFile } from 'fs';
import { execSync } from 'child_process';

// Parse command line arguments
const args = process.argv.slice(2);
const buildCliOnly = args.includes('--cli-only');
const buildTypesOnly = args.includes('--types-only');

const commonConfig = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external: [
    // External dependencies that should not be bundled
    'inquirer',
    'zod',
    'fs',
    'path',
    'os',
    'crypto',
    'child_process',
    'util',
    'events',
    'stream',
    'buffer',
    'url',
    'querystring',
    'http',
    'https',
    'net',
    'tls',
    'dns',
    'dgram',
    'cluster',
    'worker_threads',
    'perf_hooks',
    'async_hooks',
    'timers',
    'string_decoder',
    'readline',
    'repl',
    'vm',
    'inspector',
    'trace_events',
    'v8',
    'process',
    'assert',
    'constants',
    'domain',
    'module',
    'punycode',
    'querystring',
    'string_decoder',
    'sys',
    'tty',
    'zlib'
  ],
  sourcemap: true,
  minify: false,
  treeShaking: true,
  define: {
    'process.env.NODE_ENV': '"production"'
  }
};

// Ensure dist and dist-types directories exist
if (!existsSync('./dist')) {
  mkdirSync('./dist', { recursive: true });
}
if (!existsSync('./dist-types')) {
  mkdirSync('./dist-types', { recursive: true });
}

// Clean up old .d.ts files from dist directory (types are now in dist-types)
if (existsSync('./dist')) {
  const distFiles = readdirSync('./dist');
  for (const file of distFiles) {
    if (file.endsWith('.d.ts')) {
      unlinkFile(`./dist/${file}`);
      console.log(`🗑️  Removed old type file: dist/${file}`);
    }
  }
}

// Build CLI packages (API and CLI bundles)
if (!buildTypesOnly) {
  console.log('🔨 Building CLI packages...');
  
  // Build CLI bundle (ES Module)
  await build({
    ...commonConfig,
    entryPoints: ['./packages/cli-interface/cli.ts'],
    outfile: './dist/index.js',
    format: 'esm',
  });

  // Build CLI bundle (CommonJS)
  await build({
    ...commonConfig,
    entryPoints: ['./packages/cli-interface/cli.ts'],
    outfile: './dist/index.cjs',
    format: 'cjs',
  });

  // Build API bundle (ES Module) - External version
  await build({
    ...commonConfig,
    entryPoints: ['./packages/cli-api/api.ts'],
    outfile: './dist/api.js',
    format: 'esm',
  });

  // Build API bundle (CommonJS) - External version
  await build({
    ...commonConfig,
    entryPoints: ['./packages/cli-api/api.ts'],
    outfile: './dist/api.cjs',
    format: 'cjs',
  });
}

// Generate TypeScript declarations from actual source code
if (!buildCliOnly) {
  console.log('🔨 Building types package...');
  
  try {
    // Create a temporary tsconfig for declaration generation
    const tempTsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "ESNext",
        moduleResolution: "node",
        declaration: true,
        emitDeclarationOnly: true,
        outDir: "./dist-types",
        rootDir: "./packages",
        baseUrl: ".",
        paths: {
          "@codestate/core/*": ["packages/core/*"],
          "@codestate/infrastructure/*": ["packages/infrastructure/*"],
          "@codestate/cli-api/*": ["packages/cli-api/*"],
          "@codestate/cli-interface/*": ["packages/cli-interface/*"]
        },
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true
      },
      include: [
        "packages/cli-api/api.ts",
        "packages/cli-api/main.ts",
        "packages/core/domain/models/*.ts",
        "packages/core/use-cases/**/*.ts",
        "packages/core/services/**/*.ts",
        "packages/infrastructure/services/**/*.ts"
      ],
      exclude: ["node_modules", "dist", "dist-types", "tests"]
    };
    
    writeFileSync('./temp-tsconfig.json', JSON.stringify(tempTsConfig, null, 2));
    
    // Generate declarations using TypeScript compiler
    execSync('npx tsc --project temp-tsconfig.json', { stdio: 'inherit' });
    
    // Clean up temp file
    unlinkSync('./temp-tsconfig.json');
    
    // Create module declarations for the package exports
    const moduleDeclarations = `declare module 'codestate' {
  export * from './cli-api/api';
}

declare module 'codestate/api' {
  export * from './cli-api/api';
}
`;
    
    writeFileSync('./dist-types/index.d.ts', moduleDeclarations);
    writeFileSync('./dist-types/api.d.ts', 'export * from "./cli-api/api";');
    
    console.log('✅ TypeScript declarations generated from source code');
    
  } catch (error) {
    console.log('⚠️ TypeScript declaration generation failed, creating fallback declarations');
    console.log('Error:', error.message);
    
    // Fallback: Create basic declarations
    const fallbackTypes = `declare module 'codestate' {
  // Fallback type declarations
  export interface Session {
    id: string;
    name: string;
    notes?: string;
    tags?: string[];
    projectRoot: string;
    files?: string[];
    git?: any;
    scripts?: any[];
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Script {
    id: string;
    name: string;
    description?: string;
    content: string;
    tags?: string[];
    rootPath?: string;
    createdAt: Date;
    updatedAt: Date;
  }

  export interface Config {
    scripts?: any;
    git?: any;
    ide?: any;
    logging?: any;
  }

  // Use Cases
  export class SaveSession {
    execute(request: any): Promise<any>;
  }
  
  export class ResumeSession {
    execute(id: string): Promise<any>;
  }
  
  export class ListSessions {
    execute(): Promise<any>;
  }
  
  export class DeleteSession {
    execute(id: string): Promise<any>;
  }
  
  export class UpdateSession {
    execute(id: string, updates: any): Promise<any>;
  }

  export class CreateScript {
    execute(script: any): Promise<any>;
  }

  export class GetScripts {
    execute(): Promise<any>;
  }

  export class UpdateScript {
    execute(id: string, updates: any): Promise<any>;
  }

  export class DeleteScript {
    execute(id: string): Promise<any>;
  }

  export class GetConfig {
    execute(): Promise<any>;
  }

  export class UpdateConfig {
    execute(config: any): Promise<any>;
  }

  export class ImportConfig {
    execute(json: string): Promise<any>;
  }

  export class ExportConfig {
    execute(): Promise<any>;
  }

  // Git Use Cases
  export class CommitChanges {
    execute(message: string): Promise<any>;
  }

  export class CreateStash {
    execute(message?: string): Promise<any>;
  }

  export class ApplyStash {
    execute(stashId?: string): Promise<any>;
  }

  export class GetGitStatus {
    execute(): Promise<any>;
  }

  // IDE Use Cases
  export class GetAvailableIDEs {
    execute(): Promise<any>;
  }

  export class OpenFiles {
    execute(files: string[]): Promise<any>;
  }

  // Infrastructure services
  export class ConfigurableLogger {
    constructor(config?: any);
    log(message: string, context?: any): void;
    error(message: string, context?: any): void;
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    debug(message: string, context?: any): void;
  }

  export class GitService {
    commit(message: string): Promise<any>;
    stash(message?: string): Promise<any>;
    applyStash(stashId?: string): Promise<any>;
    getStatus(): Promise<any>;
  }

  export class IDEService {
    getAvailableIDEs(): Promise<any>;
    openFiles(files: string[]): Promise<any>;
  }

  export class Terminal {
    execute(command: string): Promise<any>;
  }

  // Result types
  export interface Result<T, E = Error> {
    ok: boolean;
    value?: T;
    error?: E;
  }

  export interface Success<T> {
    ok: true;
    value: T;
  }

  export interface Failure<E> {
    ok: false;
    error: E;
  }
}

declare module 'codestate/api' {
  export * from 'codestate';
}
`;
    
    writeFileSync('./dist-types/index.d.ts', fallbackTypes);
    writeFileSync('./dist-types/api.d.ts', 'export * from "./index";');
    
    console.log('✅ Fallback type declarations created');
  }
}

// Copy package.json files
if (!buildTypesOnly) {
  copyFileSync('./dist-package.json', './dist/package.json');
}
if (!buildCliOnly) {
  copyFileSync('./dist-types-package.json', './dist-types/package.json');
}

// Output build results
if (buildCliOnly) {
  console.log('✅ CLI package build completed successfully!');
  console.log('📦 CLI Package (codestate):');
  console.log('   - dist/index.js (CLI bundle)');
  console.log('   - dist/api.js (API bundle)');
  console.log('   - dist/package.json (CLI package manifest)');
} else if (buildTypesOnly) {
  console.log('✅ Types package build completed successfully!');
  console.log('📦 Types Package (@types/codestate):');
  console.log('   - dist-types/index.d.ts (Main types)');
  console.log('   - dist-types/api.d.ts (API types)');
  console.log('   - dist-types/package.json (Types package manifest)');
} else {
  console.log('✅ Dual-package build completed successfully!');
  console.log('📦 CLI Package (codestate):');
  console.log('   - dist/index.js (CLI bundle)');
  console.log('   - dist/api.js (API bundle)');
  console.log('   - dist/package.json (CLI package manifest)');
  console.log('');
  console.log('📦 Types Package (@types/codestate):');
  console.log('   - dist-types/index.d.ts (Main types)');
  console.log('   - dist-types/api.d.ts (API types)');
  console.log('   - dist-types/package.json (Types package manifest)');
} 