# CodeState - Developer Context Engine (Clean Architecture Edition)

CodeState is a developer-first context engine that captures both technical and mental state — tracking opened files, developer notes, trails, and session metadata — with support for CLI, IDE (VS Code, Cursor), and future LLM/agentic integrations.

This project is designed with a plug-and-play, scalable, future-proof architecture using principles from:

- Clean Architecture (Uncle Bob)
- Hexagonal Architecture (Ports & Adapters)
- Domain-Driven Design (DDD)
- Plugin-based extensibility

---

## 🌐 Monorepo Structure

```
codestate/
├── packages/
│   ├── core/                  # Domain, Use-Cases, Ports (pure logic)
│   │   ├── domain/            # Models, Events, Interfaces
│   │   └── use-cases/         # Application-level use cases
│   ├── infrastructure/        # File system, Git, terminal, etc.
│   │   ├── repositories/      # ISessionRepo, etc.
│   │   ├── adapters/          # Platform-specific code (fs, terminal)
│   │   ├── plugins/           # Optional services like Logger, Telemetry
│   │   └── config/            # .codestate.json loader
│   ├── cli-interface/         # Ink-based TUI + CLI commands
│   ├── vscode-extension/      # IDE extension using same services
│   ├── framework/             # DI Container, Plugin loader, Bootstrap
│   └── shared/                # Constants, utils, types
├── .codestate/                # Local state store
├── .codestate.json            # Config file for services/plugins
├── package.json               # Monorepo (Yarn/Turbo workspaces)
└── README.md
```

---

## 🧠 Core Concepts

| Layer | Role |
|-------|------|
| `domain/` | Entities, value objects, and interfaces (ports) |
| `use-cases/` | Application-level orchestration logic |
| `infrastructure/` | Adapters that implement domain interfaces |
| `framework/` | Dependency registry and plugin lifecycle |
| `cli-interface/` | TUI frontend (Inquirer) for CLI users |
| `vscode-extension/` | IDE panel, webview, or command palette integration |
| `plugins/` | Optional runtime modules (e.g., logger, heatmaps, stall detector) |

---

## 🧩 Example: Save Session Flow

### 1. Domain Model

```ts
// domain/models/Session.ts
class Session {
  constructor(public readonly id: string, public readonly filesOpened: string[], public readonly timestamp: Date) {}
  isEmpty() { return this.filesOpened.length === 0; }
}
```

### 2. Port

```ts
// domain/ports/ISessionRepository.ts
export interface ISessionRepository {
  save(session: Session): Promise<void>;
  findLatest(): Promise<Session | null>;
}
```

### 3. Use Case

```ts
// use-cases/SaveSession.ts
export class SaveSession {
  constructor(private repo: ISessionRepository) {}
  async execute(session: Session) {
    if (session.isEmpty()) throw new Error('Empty session');
    await this.repo.save(session);
  }
}
```

### 4. Implementation

```ts
// infrastructure/repositories/FsSessionRepository.ts
export class FsSessionRepository implements ISessionRepository {
  async save(session: Session) {
    const json = JSON.stringify(session, null, 2);
    await fs.promises.writeFile(\`.codestate/session-\${Date.now()}.json\`, json);
  }
  async findLatest() { /* logic here */ }
}
```

### 5. Bootstrap

```ts
// framework/bootstrap.ts
registry.register('sessionRepo', new FsSessionRepository());
registry.register('saveSession', new SaveSession(registry.get('sessionRepo')));
```

### 6. CLI Use

```ts
const saveSession = registry.get<SaveSession>('saveSession');
await saveSession.execute(currentSession);
```

---

## 🔌 Plug-and-Play Services

- Drop `LoggerService`, `StallDetector`, `TelemetryService`, or `TrailHeatmapPlugin` into `plugins/`
- Register via `codestate.config.ts`
- Supports lifecycle methods: `onInit()`, `onDestroy()`

```ts
// plugins/LoggerPlugin.ts
export const LoggerPlugin = {
  onRegister(registry) {
    registry.register('logger', new LoggerService());
  }
}
```

---

## 🔧 .codestate.json

```json
{
  "services": {
    "logger": true,
    "trail": true
  },
  "plugins": [
    "./plugins/LoggerPlugin.ts",
    "./plugins/StallDetector.ts"
  ],
  "sessionStore": ".codestate/sessions"
}
```

---

## ✅ Benefits

- 🔁 Reuse same code across CLI + IDE
- ♻️ All domain logic is testable & decoupled
- 🧩 Plugin-based and agentic AI-ready
- 🧪 TDD supported via mocks and use-case testing
- 📦 Ready for export, sync, remote AI control

---

## 🧪 Testing

```ts
test('throws on empty session', async () => {
  const mockRepo = { save: jest.fn() };
  const useCase = new SaveSession(mockRepo);
  await expect(useCase.execute(new Session('1', [], new Date()))).rejects.toThrow();
});
```

---

## 🧱 Future Extensions

- 🔍 `codestate doctor` – check env + terminals
- 📥 `.codestate.json` import/export for portability
- 🔁 Replay session trails visually
- 🧠 LLM + agent plugins
- 📸 Instant snapshot mode
- 🧑‍💻 Multi-project + timestamped notes view
- 📊 Session metrics

---

## 🛠 Getting Started (Coming Soon)

```bash
pnpm install
pnpm dev        # run CLI with hot reload
pnpm build:ext  # build VS Code extension
```

---

This starter is designed to evolve with you — CLI-first, LLM-later.---

## 📦 Core Module Exposure (`core/index.ts`)

To keep the architecture clean and future-proof, **only services** are exposed from the `core` module.
This ensures that external consumers like the CLI or IDE extensions cannot directly access low-level domain models, infra, or adapters.

### Example: `core/index.ts`

```ts
// packages/core/index.ts

export { SaveSession } from './use-cases/SaveSession';
export { ResumeSession } from './use-cases/ResumeSession';
export { ExportSession } from './use-cases/ExportSession';
export { LoggerService } from './services/logger/LoggerService';
export { TrailService } from './services/trail/TrailService';
// No exports from domain/models, infra/adapters, or internal constants
```

Then the CLI or IDE uses only:

```ts
import { SaveSession, LoggerService } from '@codestate/core';
```

This creates a **strong boundary**: external UIs can call use cases, but never mutate core internals.

---

---

## 🧱 Complete Folder Structure (Clean + Plugin-Ready + IDE-Safe)

```
codestate/
├── packages/
│
│── core/                            # ✅ Pure logic (domain, use-cases, ports, DI-safe)
│   ├── domain/
│   │   ├── models/                  # Entities and value objects
│   │   ├── ports/                   # Interfaces (repositories, services, adapters)
│   │   ├── events/                  # Domain events (optional)
│   │   └── types/                   # Domain-specific enums, shared types
│   ├── use-cases/                   # Application-level logic (no UI, no infra)
│   ├── services/                    # Thin reusable service wrappers (not infra)
│   ├── core-utils/                  # Internal-only helpers (not exposed to CLI/IDE)
│   └── index.ts                     # ✅ Only exposes use-cases and services
│
│── infrastructure/                 # ✅ Implements all interfaces (ports)
│   ├── repositories/               # ISessionRepo, INoteRepo, etc.
│   ├── adapters/                   # Platform-specific I/O
│   ├── services/                   # Logger, FS, Encryption, etc.
│   ├── config/                     # .codestate.json + runtime config
│   └── constants/                  # Static values (paths, keys)
│
│── framework/                      # ✅ DI, Plugin Loader, Lifecycle engine
│   ├── registry/                   # DI container
│   ├── plugins/                    # Core & optional plugins
│   ├── lifecycle/                  # Lifecycle hooks
│   └── bootstrap.ts                # Registers everything on startup
│
│── cli-api/                        # ✅ Shared between CLI and IDE (NO UI code)
│   ├── resume.ts
│   ├── save.ts
│   ├── export.ts
│   └── index.ts                    # Exposes CLI-safe logic to IDE and TUI
│
│── cli-interface/                  # ✅ CLI wrapper only (TUI or headless)
│   ├── tui/
│   │   ├── components/
│   │   ├── screens/
│   │   └── App.tsx
│   ├── commands/
│   └── inkEntrypoint.ts
│
│── vscode-extension/               # ✅ IDE extension (imports from cli-api only)
│   ├── extension.ts
│   ├── adapters/                   # Optional IDE-specific wrappers
│   └── webview/                    # UI for side panels or trees
│
│── shared/                         # ✅ Shared constants, validators, utils
│   ├── types/
│   ├── utils/
│   └── constants/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── .codestate/                     # Local state/cache folder
├── .codestate.json                 # Config file (plugin and service control)
├── package.json                    # Monorepo root
├── tsconfig.base.json
└── README.md
```

---

## 🧩 Example: Domain Port and Implementation (Logger)

### Port

```ts
// core/domain/ports/ILoggerService.ts
export interface ILoggerService {
  log(msg: string): void;
  error(msg: string): void;
}
```

### Implementation

```ts
// infrastructure/services/ConsoleLogger.ts
import { ILoggerService } from '@codestate/core/domain/ports';

export class ConsoleLogger implements ILoggerService {
  log(msg: string) {
    console.log(`[LOG] ${msg}`);
  }
  error(msg: string) {
    console.error(`[ERROR] ${msg}`);
  }
}
```

### Registration

```ts
// framework/plugins/LoggerPlugin.ts
export const LoggerPlugin = {
  onRegister(registry) {
    registry.register('logger', new ConsoleLogger());
  }
}
```

---

## 📦 Core Module Exposure (`core/index.ts`)

To keep the architecture clean and future-proof, **only services** are exposed from the `core` module.

### `core/index.ts`

```ts
export { SaveSession } from './use-cases/SaveSession';
export { ResumeSession } from './use-cases/ResumeSession';
export { ExportSession } from './use-cases/ExportSession';
export { LoggerService } from './services/logger/LoggerService';
export { TrailService } from './services/trail/TrailService';
// Domain models, adapters, and infra are internal-only
```

---

## 🧠 Three-Bundle Output Structure

This architecture compiles to:

| Bundle File   | Contents                                  | Imports From           |
|---------------|--------------------------------------------|------------------------|
| `core.js`     | Domain models, services, use-cases         | (self-contained)       |
| `cli.js`      | CLI code only (TUI, Commander)             | core.js                |
| `extension.js`| IDE code only                              | cli-api.js → core.js   |

No duplication. IDE reuses CLI-safe APIs. CLI reuses core.

---

## 🚀 Advanced Engineering Best Practices & Extensions

To maximize maintainability, extensibility, and production-readiness, the following best practices and architectural extensions are recommended:

### 1. Validation Layer
- Use a schema validation library (e.g., Zod, Joi) for:
  - Config file validation (on load and save)
  - User input validation (CLI prompts)
- Prevents invalid states/configs and improves error messages.

### 2. Async/Await Everywhere
- All interfaces (storage, encryption, logger, etc.) should be async-first, even if initial implementations are sync.
- Enables easy migration to cloud/remote backends in the future.

### 3. Event/Hook System
- Add a simple event emitter or hook system in the framework layer.
- Enables plugins or future features (telemetry, notifications, analytics) to react to core events (session saved, error occurred, config changed).

### 4. Pluggable Service Registry
- Design the DI/registry so that plugins or user code can register/override services at runtime.
- Supports advanced users and future extension (e.g., custom encryption, remote storage).

### 5. Structured Logging
- Use structured logging (JSON logs, log levels, timestamps) from the start.
- Facilitates debugging, telemetry, and integrations.

### 6. Session/Operation Metadata
- All core operations (save, resume, etc.) should accept and emit metadata (timestamps, user, tags, etc.).
- Supports audit trails, analytics, and advanced search.

### 7. Internationalization (i18n) Ready
- Abstract user-facing strings early, even if only English is supported initially.
- Simplifies future localization.

### 8. CLI UX Consistency
- Define a CLI UX style guide (prompt order, error display, help text, etc.).
- Ensures a consistent, professional user experience.

### 9. Config Versioning & Migration
- Add a `version` field to the config JSON.
- Plan for migration logic if/when the config schema changes.

### 10. Security Best Practices
- Never log sensitive data by default.
- Allow users to opt-in to telemetry or analytics (never on by default).

---

**Adopting these practices will ensure CodeState remains robust, extensible, and ready for future growth and integrations.**

## 🏗️ Facade/Service Layer Pattern for Dependency Injection and CLI/IDE Consumption

To balance Clean Architecture, testability, and ease of use for CLI/IDE consumers, CodeState uses a Facade/Service Layer pattern:

- **Internal Layers:**
  - All core and infrastructure services use Dependency Injection (DI) for flexibility, testability, and composability.
  - Services like FileStorage, Encryption, Logger, etc., are constructed with their dependencies injected.

- **Exported Facade/Wrapper Layer:**
  - A "facade" or "service layer" (e.g., `CodestateCore`) wires up all dependencies using DI internally.
  - This facade exposes simple, high-level methods/classes to the CLI and IDE extension.
  - Consumers (CLI, IDE) never have to manually wire up dependencies—they just import and use the facade.

- **CLI/IDE Layer:**
  - Only interacts with the facade/service layer.
  - No DI or manual wiring required in CLI/IDE code.

### Example Structure

```ts
// core/services/CodestateCore.ts
import { FileStorage } from '...';
import { BasicEncryption } from '...';
import { ConsoleLogger } from '...';

export class CodestateCore {
  private logger = new ConsoleLogger();
  private encryption = new BasicEncryption(this.logger);
  private storage = new FileStorage(this.logger, this.encryption, ...);

  // High-level methods
  async saveSession(data: SessionData) {
    // ...use storage, encryption, logger, etc.
  }
  // ...other methods
}
```

```ts
// core/index.ts
export { CodestateCore } from './services/CodestateCore';
```

```ts
// CLI/IDE
import { CodestateCore } from '@codestate/core';
const core = new CodestateCore();
await core.saveSession(...);
```

### Benefits
- **Testability:** All core logic is testable with mocks/stubs because of DI.
- **Encapsulation:** CLI/IDE code is clean, simple, and decoupled from internal wiring.
- **Extensibility:** Easy to swap implementations, add plugins, or change wiring in one place (the facade).
- **Separation of Concerns:** Core logic is pure and composable; CLI/IDE is just a consumer.
- **Consistency:** Follows Clean Architecture and Hexagonal/Ports & Adapters principles.

**This pattern ensures that CodeState remains maintainable, testable, and user-friendly for CLI/IDE consumers, while keeping the internal architecture flexible and robust.**