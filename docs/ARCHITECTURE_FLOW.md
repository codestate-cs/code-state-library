# CodeState Architecture Flow: CLI to Repository

This document outlines the complete flow architecture used in CodeState, from CLI commands down to the repository layer. This pattern is used consistently across all modules.

## 🏗️ **Architecture Overview**

```
CLI Layer → Command Layer → CLI API Layer → Use Case Layer → Service Layer → Repository Layer → File System
```

## 📋 **Layer Responsibilities**

### **1. CLI Layer (`packages/cli-interface/cli.ts`)**
- **Purpose**: Entry point for command-line interface
- **Responsibilities**:
  - Parse command line arguments
  - Handle global flags (--help, --version)
  - Route to appropriate command handler
  - Provide error handling and exit codes

### **2. Command Layer (`packages/cli-interface/commands/`)**
- **Purpose**: Route and handle specific commands
- **Responsibilities**:
  - Route commands to appropriate handlers
  - Handle command-specific argument parsing
  - Provide command-specific error messages

### **3. TUI Handler Layer (`packages/cli-interface/tui/[module]/cliHandler.ts`)**
- **Purpose**: Handle module-specific commands and TUI interactions
- **Responsibilities**:
  - Execute use cases for non-interactive commands
  - Launch TUI for interactive commands
  - Handle module-specific validation and error handling

### **4. CLI API Layer (`packages/cli-api/api.ts`)**
- **Purpose**: Export use cases and services for CLI interface
- **Responsibilities**:
  - Export use cases from core layer
  - Export services and facades
  - Provide clean API for CLI interface
  - Handle dependency injection for CLI

### **5. Use Case Layer (`packages/core/use-cases/[module]/`)**
- **Purpose**: Business logic and application rules
- **Responsibilities**:
  - Implement business logic
  - Coordinate between services
  - Handle input validation
  - Return structured results

### **6. Service Layer (`packages/core/services/[module]/`)**
- **Purpose**: Application services and domain logic
- **Responsibilities**:
  - Application-level operations
  - Dependency injection
  - Logging and monitoring
  - Data transformation

### **7. Repository Layer (`packages/infrastructure/repositories/`)**
- **Purpose**: Data persistence and storage
- **Responsibilities**:
  - CRUD operations
  - Data validation
  - Encryption/decryption
  - Atomic operations
  - Error recovery

### **8. File System Layer**
- **Purpose**: Physical data storage
- **Responsibilities**:
  - File I/O operations
  - Atomic writes
  - Backup management
  - Permission handling

## 🔄 **Complete Flow Example: Config Module**

### **Command: `codestate config show`**

```
1. CLI Entry Point
   ┌─────────────────────────────────────┐
   │ cli.ts                              │
   │ - Parse: ["config", "show"]         │
   │ - Route to: handleCommand()         │
   └─────────────────────────────────────┘
                    ↓
   
2. Command Router
   ┌─────────────────────────────────────┐
   │ commands/index.ts                   │
   │ - Route: "config" → config handler  │
   │ - Call: handleConfigCommand()       │
   └─────────────────────────────────────┘
                    ↓
   
3. TUI Handler
   ┌─────────────────────────────────────┐
   │ tui/config/cliHandler.ts            │
   │ - Subcommand: "show"                │
   │ - Call: showConfigCommand()         │
   └─────────────────────────────────────┘
                    ↓
   
4. Command Implementation
   ┌─────────────────────────────────────┐
   │ commands/config/showConfig.ts       │
   │ - Import: { GetConfig } from        │
   │   '@codestate/cli-api/api'         │
   │ - Create: new GetConfig()           │
   │ - Execute: getConfig.execute()      │
   └─────────────────────────────────────┘
                    ↓
   
5. CLI API Layer
   ┌─────────────────────────────────────┐
   │ cli-api/api.ts                     │
   │ - Export: { GetConfig } from        │
   │   '@codestate/core/use-cases/config'│
   │ - Export: { ConfigurableLogger }    │
   │   from infrastructure services      │
   └─────────────────────────────────────┘
                    ↓
   
6. Use Case
   ┌─────────────────────────────────────┐
   │ core/use-cases/config/GetConfig.ts  │
   │ - Business logic                    │
   │ - Call: configService.getConfig()   │
   └─────────────────────────────────────┘
                    ↓
   
7. Service Layer
   ┌─────────────────────────────────────┐
   │ core/services/config/ConfigFacade.ts│
   │ - Dependency injection              │
   │ - Call: ConfigService.getConfig()   │
   └─────────────────────────────────────┘
                    ↓
   
8. Repository
   ┌─────────────────────────────────────┐
   │ infrastructure/repositories/        │
   │ ConfigRepository.ts                 │
   │ - Load: repository.load()           │
   │ - Validate: Zod schema              │
   │ - Decrypt: if encrypted             │
   └─────────────────────────────────────┘
                    ↓
   
9. File System
   ┌─────────────────────────────────────┐
   │ ~/.codestate/config.json            │
   │ - Read: fs.readFile()               │
   │ - Parse: JSON.parse()               │
   │ - Validate: Schema validation       │
   └─────────────────────────────────────┘
```

## 📁 **File Structure Template**

```
packages/
├── cli-api/
│   └── api.ts                          # Export use cases and services
├── cli-interface/
│   ├── cli.ts                           # Main CLI entry point
│   ├── commands/
│   │   ├── index.ts                     # Main command router
│   │   └── [module]/                     # Module-specific commands
│   │       ├── index.ts                 # Export all commands
│   │       ├── show[Module].ts          # Show command
│   │       ├── create[Module].ts        # Create command
│   │       ├── update[Module].ts        # Update command
│   │       └── delete[Module].ts        # Delete command
│   └── tui/
│       └── [module]/
│           ├── index.ts                 # Export TUI functions
│           ├── cliHandler.ts            # CLI command handler
│           ├── show[Module]Tui.ts       # Interactive show
│           ├── create[Module]Tui.ts     # Interactive create
│           ├── update[Module]Tui.ts     # Interactive update
│           └── delete[Module]Tui.ts     # Interactive delete
├── core/
│   ├── domain/
│   │   ├── models/
│   │   │   └── [Module].ts              # Domain models
│   │   ├── ports/
│   │   │   └── I[Module]Service.ts      # Service interfaces
│   │   └── schemas/
│   │       └── SchemaRegistry.ts        # Zod schemas
│   ├── services/
│   │   └── [module]/
│   │       ├── [Module]Service.ts       # Business logic
│   │       └── [Module]Facade.ts        # Dependency injection
│   └── use-cases/
│       └── [module]/
│           ├── index.ts                 # Export all use cases
│           ├── Get[Module].ts           # Get use case
│           ├── Create[Module].ts        # Create use case
│           ├── Update[Module].ts        # Update use case
│           └── Delete[Module].ts        # Delete use case
└── infrastructure/
    ├── repositories/
    │   └── [Module]Repository.ts        # Data persistence
    └── services/
        ├── [Module]Logger.ts            # Logging
        ├── [Module]Encryption.ts        # Encryption
        └── [Module]Storage.ts           # Storage
```

## 🔧 **Implementation Guidelines**

### **1. CLI Layer**
```typescript
// cli.ts
import { handleCommand } from './commands';

async function main() {
  const [command, subcommand, ...options] = process.argv.slice(2);
  await handleCommand(command, subcommand, options);
}
```

### **2. Command Router**
```typescript
// commands/index.ts
import { handle[Module]Command } from '../tui/[module]';

export async function handleCommand(command: string, subcommand: string, options: string[]) {
  switch (command) {
    case '[module]':
      await handle[Module]Command(subcommand, options);
      break;
    default:
      console.error(`Error: Unknown command '${command}'`);
      process.exit(1);
  }
}
```

### **3. TUI Handler**
```typescript
// tui/[module]/cliHandler.ts
import { show[Module]Command } from '../../commands/[module]/show[Module]';
import { show[Module]Tui } from './show[Module]Tui';

export async function handle[Module]Command(subcommand: string, options: string[]) {
  switch (subcommand) {
    case 'show':
      await show[Module]Command();
      break;
    case 'edit':
      await show[Module]Tui();
      break;
    default:
      console.error(`Error: Unknown [module] subcommand '${subcommand}'`);
      process.exit(1);
  }
}
```

### **4. Command Implementation**
```typescript
// commands/[module]/show[Module].ts
import { Get[Module], ConfigurableLogger } from '@codestate/cli-api/api';

export async function show[Module]Command() {
  const logger = new ConfigurableLogger();
  const get[Module] = new Get[Module]();
  const result = await get[Module].execute();
  if (result.ok) {
    logger.log('Current [module]:', { [module]: result.value });
  } else {
    logger.error('Failed to load [module]', { error: result.error });
  }
}
```

### **5. CLI API Layer**
```typescript
// cli-api/api.ts
export { Get[Module] } from '@codestate/core/use-cases/[module]/Get[Module]';
export { Create[Module] } from '@codestate/core/use-cases/[module]/Create[Module]';
export { Update[Module] } from '@codestate/core/use-cases/[module]/Update[Module]';
export { Delete[Module] } from '@codestate/core/use-cases/[module]/Delete[Module]';
export { ConfigurableLoggerFacade as ConfigurableLogger } from '@codestate/infrastructure/services/ConfigurableLogger/ConfigurableLoggerFacade';
export * from '@codestate/core/use-cases/[module]';
```

### **6. Use Case**
```typescript
// core/use-cases/[module]/Get[Module].ts
import { I[Module]Service } from '@codestate/core/domain/ports/I[Module]Service';
import { [Module]Facade } from '@codestate/core/services/[module]/[Module]Facade';

export class Get[Module] {
  private [module]Service: I[Module]Service;
  
  constructor([module]Service?: I[Module]Service) {
    this.[module]Service = [module]Service || new [Module]Facade();
  }
  
  async execute(): Promise<Result<[Module]>> {
    return this.[module]Service.get[Module]();
  }
}
```

### **7. Service**
```typescript
// core/services/[module]/[Module]Facade.ts
import { I[Module]Service } from '@codestate/core/domain/ports/I[Module]Service';
import { [Module]Service } from './[Module]Service';
import { [Module]Repository } from '@codestate/infrastructure/repositories/[Module]Repository';

export class [Module]Facade implements I[Module]Service {
  private service: [Module]Service;

  constructor() {
    const repository = new [Module]Repository();
    this.service = new [Module]Service(repository);
  }

  async get[Module]() {
    return this.service.get[Module]();
  }
}
```

### **8. Repository**
```typescript
// infrastructure/repositories/[Module]Repository.ts
import { I[Module]Repository } from '@codestate/core/domain/ports/I[Module]Service';
import { [Module] } from '@codestate/core/domain/models/[Module]';
import { validate[Module] } from '@codestate/core/domain/schemas/SchemaRegistry';

export class [Module]Repository implements I[Module]Repository {
  async load(): Promise<Result<[Module]>> {
    // Implementation with validation, encryption, atomic writes
  }
  
  async save([module]: [Module]): Promise<Result<void>> {
    // Implementation with validation, encryption, atomic writes
  }
}
```

## 🛡️ **Security & Reliability Features**

### **1. Atomic Operations**
- Use temp files + rename for atomic writes
- Backup files before destructive operations
- Handle partial failures gracefully

### **2. Validation**
- Zod schema validation at every layer
- Input sanitization
- Type safety with TypeScript

### **3. Encryption**
- AES-256-GCM for sensitive data
- Key management best practices
- Graceful decryption failure handling

### **4. Error Handling**
- Structured error types
- Comprehensive logging
- User-friendly error messages
- Proper exit codes

### **5. Logging**
- Structured logging with levels
- Sensitive data sanitization
- Audit trail for all operations

## 📊 **Module Template Checklist**

When creating a new module, ensure you have:

- [ ] **CLI Layer**: Command parsing and routing
- [ ] **Command Layer**: Module-specific command handlers
- [ ] **TUI Layer**: Interactive UI components
- [ ] **Use Case Layer**: Business logic implementation
- [ ] **Service Layer**: Application services and DI
- [ ] **Repository Layer**: Data persistence
- [ ] **Domain Models**: TypeScript interfaces
- [ ] **Schemas**: Zod validation schemas
- [ ] **Error Types**: Structured error handling
- [ ] **Tests**: Unit and integration tests

## 🚀 **Benefits of This Architecture**

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Each layer can be tested independently
3. **Maintainability**: Clear dependencies and interfaces
4. **Extensibility**: Easy to add new modules and features
5. **Security**: Validation and encryption at multiple layers
6. **Reliability**: Atomic operations and error recovery
7. **Performance**: Efficient data flow and caching opportunities

This architecture provides a solid foundation for building scalable, maintainable, and secure applications! 🎯 