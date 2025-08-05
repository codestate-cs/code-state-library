#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { readdir, mkdir } from 'fs/promises';
import { join } from 'path';

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isCoreOnly = args.includes('--core-only');
const isCliOnly = args.includes('--cli-only');

// Common esbuild options
const commonOptions = {
  platform: 'node',
  target: 'node18',
  format: 'esm',
  bundle: true,
  minify: false,
  sourcemap: true,
  logLevel: 'info',
};

// Core package build configuration
const coreBuild = async () => {
  console.log('🔨 Building codestate-core...');
  
  const result = await esbuild.build({
    ...commonOptions,
    entryPoints: ['packages/core/api.ts'],
    outfile: 'packages/core/dist/index.js',
    external: [
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
      'punycode',
      'readline',
      'repl',
      'tty',
      'vm',
      'assert',
      'constants',
      'domain',
      'module',
      'process',
      'v8',
      'inspector',
      'trace_events',
      'wasi'
    ],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  });

  console.log('✅ codestate-core built successfully');
  return result;
};

// CLI package build configuration
const cliBuild = async () => {
  console.log('🔨 Building @codestate CLI...');
  
  const result = await esbuild.build({
    ...commonOptions,
    entryPoints: ['packages/cli-interface/cli.ts'],
    outfile: 'packages/cli-interface/dist/cli.js',
    external: [
      'codestate-core',
      'inquirer',
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
      'punycode',
      'readline',
      'repl',
      'tty',
      'vm',
      'assert',
      'constants',
      'domain',
      'module',
      'process',
      'v8',
      'inspector',
      'trace_events',
      'wasi'
    ],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    plugins: [
      {
        name: 'import-transformer',
        setup(build) {
          // Transform imports from codestate-core/* to codestate-core
          build.onResolve({ filter: /^@codestate\/core\// }, args => {
            return {
              path: 'codestate-core',
              external: true
            };
          });
        }
      }
    ]
  });

  console.log('✅ @codestate CLI built successfully');
  return result;
};

// Main build function
const build = async () => {
  try {
    // Create dist directories
    await mkdir('packages/core/dist', { recursive: true });
    await mkdir('packages/cli-interface/dist', { recursive: true });

    if (isCoreOnly) {
      await coreBuild();
    } else if (isCliOnly) {
      await cliBuild();
    } else {
      // Build both packages
      await coreBuild();
      await cliBuild();
    }

    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
};

// Watch mode
const watch = async () => {
  console.log('👀 Starting watch mode...');
  
  if (isCoreOnly) {
    const context = await esbuild.context({
      ...commonOptions,
      entryPoints: ['packages/core/api.ts'],
      outfile: 'packages/core/dist/index.js',
      external: [
        'zod',
        'fs', 'path', 'os', 'crypto', 'child_process', 'util', 'events', 'stream',
        'buffer', 'url', 'querystring', 'http', 'https', 'net', 'tls', 'dns',
        'dgram', 'cluster', 'worker_threads', 'perf_hooks', 'async_hooks',
        'timers', 'string_decoder', 'punycode', 'readline', 'repl', 'tty',
        'vm', 'assert', 'constants', 'domain', 'module', 'process', 'v8',
        'inspector', 'trace_events', 'wasi'
      ],
      define: { 'process.env.NODE_ENV': '"production"' }
    });
    
    await context.watch();
    console.log('👀 Watching codestate-core...');
      } else if (isCliOnly) {
      const context = await esbuild.context({
        ...commonOptions,
        entryPoints: ['packages/cli-interface/cli.ts'],
        outfile: 'packages/cli-interface/dist/cli.js',
        external: [
          'codestate-core',
          'inquirer',
          'fs', 'path', 'os', 'crypto', 'child_process', 'util', 'events', 'stream',
          'buffer', 'url', 'querystring', 'http', 'https', 'net', 'tls', 'dns',
          'dgram', 'cluster', 'worker_threads', 'perf_hooks', 'async_hooks',
          'timers', 'string_decoder', 'punycode', 'readline', 'repl', 'tty',
          'vm', 'assert', 'constants', 'domain', 'module', 'process', 'v8',
          'inspector', 'trace_events', 'wasi'
        ],
        define: { 'process.env.NODE_ENV': '"production"' },
        plugins: [
          {
            name: 'import-transformer',
            setup(build) {
              build.onResolve({ filter: /^@codestate\/core\// }, args => {
                return { path: 'codestate-core', external: true };
              });
            }
          }
        ]
      });
    
    await context.watch();
    console.log('👀 Watching @codestate CLI...');
  } else {
    // Watch both packages
    const coreContext = await esbuild.context({
      ...commonOptions,
      entryPoints: ['packages/core/api.ts'],
      outfile: 'packages/core/dist/index.js',
      external: [
        'zod',
        'fs', 'path', 'os', 'crypto', 'child_process', 'util', 'events', 'stream',
        'buffer', 'url', 'querystring', 'http', 'https', 'net', 'tls', 'dns',
        'dgram', 'cluster', 'worker_threads', 'perf_hooks', 'async_hooks',
        'timers', 'string_decoder', 'punycode', 'readline', 'repl', 'tty',
        'vm', 'assert', 'constants', 'domain', 'module', 'process', 'v8',
        'inspector', 'trace_events', 'wasi'
      ],
      define: { 'process.env.NODE_ENV': '"production"' }
    });
    
    const cliContext = await esbuild.context({
      ...commonOptions,
      entryPoints: ['packages/cli-interface/cli.ts'],
      outfile: 'packages/cli-interface/dist/cli.js',
      external: [
        'codestate-core', 'inquirer',
        'fs', 'path', 'os', 'crypto', 'child_process', 'util', 'events', 'stream',
        'buffer', 'url', 'querystring', 'http', 'https', 'net', 'tls', 'dns',
        'dgram', 'cluster', 'worker_threads', 'perf_hooks', 'async_hooks',
        'timers', 'string_decoder', 'punycode', 'readline', 'repl', 'tty',
        'vm', 'assert', 'constants', 'domain', 'module', 'process', 'v8',
        'inspector', 'trace_events', 'wasi'
      ],
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [
        {
          name: 'import-transformer',
          setup(build) {
            build.onResolve({ filter: /^@codestate\/core\// }, args => {
              return { path: 'codestate-core', external: true };
            });
          }
        }
      ]
    });
    
    await Promise.all([
      coreContext.watch(),
      cliContext.watch()
    ]);
    
    console.log('👀 Watching both packages...');
  }
};

// Run build or watch
if (isWatch) {
  watch();
} else {
  build();
} 