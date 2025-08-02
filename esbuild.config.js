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
  
  // Build API bundle
  await build({
    ...commonConfig,
    entryPoints: ['./packages/cli-api/main.ts'],
    outfile: './dist/api.js',
    format: 'esm',
  });

  // Build CLI bundle
  await build({
    ...commonConfig,
    entryPoints: ['./packages/cli-interface/cli.ts'],
    outfile: './dist/index.js',
    format: 'esm',
  });
}

// Generate comprehensive TypeScript declarations
if (!buildCliOnly) {
  console.log('🔨 Building types package...');
  
  try {
    // Create a temporary tsconfig for comprehensive declaration generation
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
          "@codestate/*": ["packages/*"]
        },
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      },
      include: [
        "packages/cli-api/**/*.ts",
        "packages/core/**/*.ts",
        "packages/infrastructure/**/*.ts"
      ],
      exclude: ["node_modules", "dist", "dist-types", "tests"]
    };
    
    writeFileSync('./temp-tsconfig.json', JSON.stringify(tempTsConfig, null, 2));
    execSync('npx tsc --project temp-tsconfig.json', { stdio: 'inherit' });
    
    // Clean up temp file
    unlinkSync('./temp-tsconfig.json');
    console.log('✅ TypeScript declarations generated');
  } catch (error) {
    console.log('⚠️ TypeScript declarations generation failed, creating comprehensive declarations');
    
    // Create comprehensive type declarations as fallback
    const comprehensiveTypes = `declare module 'codestate/api' {
  // Core domain models
  export interface Session {
    id: string;
    name: string;
    notes?: string;
    tags?: string[];
    projectRoot: string;
    files?: string[];
    git?: { 
      branch: string; 
      commit: string; 
      isDirty: boolean; 
    };
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
    scripts?: {
      rootPath?: string;
      defaultTags?: string[];
    };
    git?: {
      autoStash?: boolean;
      autoCommit?: boolean;
    };
    ide?: {
      defaultEditor?: string;
      openFiles?: boolean;
    };
    logging?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
      output?: 'console' | 'file' | 'both';
      filePath?: string;
    };
  }

  // API Use Cases
  export class SaveSession {
    execute(request: {
      name: string;
      notes?: string;
      tags?: string[];
      projectRoot: string;
      files?: string[];
      git?: any;
    }): Promise<{ success: boolean; data?: Session; error?: any }>;
  }
  
  export class ResumeSession {
    execute(id: string): Promise<{ success: boolean; data?: Session; error?: any }>;
  }
  
  export class ListSessions {
    execute(): Promise<{ success: boolean; data?: Session[]; error?: any }>;
  }
  
  export class DeleteSession {
    execute(id: string): Promise<{ success: boolean; error?: any }>;
  }
  
  export class UpdateSession {
    execute(id: string, updates: {
      name?: string;
      notes?: string;
      tags?: string[];
    }): Promise<{ success: boolean; data?: Session; error?: any }>;
  }

  export class CreateScript {
    execute(script: {
      name: string;
      description?: string;
      content: string;
      tags?: string[];
      rootPath?: string;
    }): Promise<{ success: boolean; data?: Script; error?: any }>;
  }

  export class GetScripts {
    execute(): Promise<{ success: boolean; data?: Script[]; error?: any }>;
  }

  export class UpdateScript {
    execute(id: string, updates: {
      name?: string;
      description?: string;
      content?: string;
      tags?: string[];
    }): Promise<{ success: boolean; data?: Script; error?: any }>;
  }

  export class DeleteScript {
    execute(id: string): Promise<{ success: boolean; error?: any }>;
  }

  export class GetConfig {
    execute(): Promise<{ ok: boolean; value?: Config; error?: any }>;
  }

  export class UpdateConfig {
    execute(config: Partial<Config>): Promise<{ ok: boolean; value?: Config; error?: any }>;
  }

  // Infrastructure services
  export class ConfigurableLogger {
    constructor(config?: {
      level?: 'debug' | 'info' | 'warn' | 'error';
      output?: 'console' | 'file' | 'both';
      filePath?: string;
    });
    error(message: string, context?: any): void;
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    debug(message: string, context?: any): void;
  }

  // Result types
  export interface Result<T, E = Error> {
    success: boolean;
    data?: T;
    error?: E;
  }

  export interface Success<T> {
    success: true;
    data: T;
  }

  export interface Failure<E> {
    success: false;
    error: E;
  }
}`;

  writeFileSync('./dist-types/index.d.ts', comprehensiveTypes);
  writeFileSync('./dist-types/api.d.ts', comprehensiveTypes);
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
  console.log('   - dist/api.js (API bundle)');
  console.log('   - dist/index.js (CLI bundle)');
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
  console.log('   - dist/api.js (API bundle)');
  console.log('   - dist/index.js (CLI bundle)');
  console.log('   - dist/package.json (CLI package manifest)');
  console.log('');
  console.log('📦 Types Package (@types/codestate):');
  console.log('   - dist-types/index.d.ts (Main types)');
  console.log('   - dist-types/api.d.ts (API types)');
  console.log('   - dist-types/package.json (Types package manifest)');
} 