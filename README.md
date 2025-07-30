# CodeState Monorepo

A developer context engine for saving and resuming your full development environment.

## Structure

- `packages/core` - Domain, use-cases, ports, services
- `packages/infrastructure` - Adapters, repositories, services
- `packages/framework` - DI, plugin loader, lifecycle
- `packages/cli-api` - CLI/IDE-safe logic
- `packages/cli-interface` - CLI and TUI
- `packages/vscode-extension` - IDE extension
- `packages/shared` - Types, utils, constants
- `tests` - Unit and integration tests

## Getting Started

1. Install dependencies: `pnpm install` (or `npm install`)
2. Run CLI: `pnpm dev` or `npm run dev`
3. Build: `pnpm build`

## Scripts

- `dev` - Start CLI in dev mode
- `build` - Build all packages
- `test` - Run all tests

## License
MIT 