# Codestate File Storage System: Deep-Dive Reference

## 1. Storage Location
- **Default:** All data is stored in a single, user-specific, hidden directory.
  - **Linux:** `~/.codestate/`
  - **macOS:** `~/Library/Application Support/codestate/`
  - **Windows:** `%APPDATA%\codestate\`
- **Directory creation:** On first run, the directory is created with secure permissions (`0700` for directories, `0600` for files).
- **No project-root storage:** No files are stored in the current working directory or project root by default.
- **Config extensibility:** The storage path is hardcoded for now, but a `dataDir` field exists in the config schema for future override support.

---

## 2. File Format & Atomicity
- **One file per entity:**
  - Session: `sessions/<session-id>.json`
  - Terminal config: `terminal-configs/<config-id>.json`
  - Global config: `config.json`
  - Index: `sessions/index.json`
- **Atomic writes:**
  1. Write to a temp file (e.g., `index.json.tmp`).
  2. Flush and fsync the temp file.
  3. Atomically rename to the target file.
  4. Backup the old file before renaming (e.g., `index.json.bak`).
- **No partial writes:** The file is either the old or new version, never a partial/corrupt state.

---

## 3. Encryption
- **Enabled via config:** `encryption.enabled` and `encryption.key` (stored in `config.json` under `encryption`).
- **Algorithm:** AES-256-GCM (or equivalent, authenticated encryption).
- **Key management:**
  - Key is never hardcoded in code.
  - Can be stored in config (with a warning), or prompted from user, or (in future) via env var.
- **Salt and IV:** Stored with the file, not the key.
- **File format:** Encrypted data is base64 or hex, with a clear header (e.g., `ENCRYPTED_v1`).
- **Decryption:** Fail gracefully with clear error if decryption fails.
- **Permissions:** All sensitive files are written with `0600` permissions.

---

## 4. Indexing & Listing
- **Index file:** `sessions/index.json` contains metadata for all sessions (id, name, projectRoot, tags, createdAt, updatedAt, etc.).
- **Atomic updates:** Index file is always updated atomically (temp file + rename).
- **Backup:** Optionally, keep a rolling backup of the index file.
- **Listing/searching:** All list/search operations use the index for speed; full session files are loaded as needed.

---

## 5. CRUD Operations
- **Create/Update:**
  - Write file atomically.
  - Update index file atomically.
  - Validate data with Zod schema before writing.
  - Encrypt if enabled.
- **Read:**
  - Validate with Zod schema after decrypting (if needed).
  - Handle missing/corrupt files gracefully.
- **Delete:**
  - Remove file.
  - Update index file atomically.
  - Backup before destructive operations.
- **Backup/restore:**
  - Before any destructive operation, backup the file (e.g., `.bak`).
  - Restore from backup if needed.

---

## 6. Validation & Versioning
- **Schema validation:** All files are validated with Zod schemas on read/write.
- **Versioning:** Each file includes a `version` field for migration support.
- **Migration:** Migration scripts can upgrade old files to new schema versions.
- **Graceful failure:** If an unknown or invalid version is encountered, fail gracefully and log a clear error.

---

## 7. Security & Extensibility
- **File permissions:** All files are written with secure permissions (`0600`).
- **Path validation:** All file paths are sanitized and validated to prevent traversal attacks.
- **Extensions:** All schemas include an `extensions` field for future-proofing and plugin data.
- **No business logic in CLI/UI:** All file operations are handled in the utility/repository layer.
- **Logging:** All file operations and errors are logged (with sensitive data sanitized).

---

## 8. Testing & TDD
- **TDD/BDD enforced:** All CRUD and index operations are covered by tests (happy path, corrupt file, missing file, malicious input, etc.).
- **Property-based/fuzz testing:** For critical logic (e.g., encryption, atomicity).
- **Test fixtures:** All test files and fixtures are organized and isolated.

---

## 9. Multi-OS Path Handling (URGENT)
- **Path Normalization:**
  - Store all paths in POSIX format internally (forward slashes)
  - Convert to OS-specific format only for file system operations
  - Handle drive letters for Windows (e.g., `C:/` → `C:\`)
  - Support UNC paths for Windows network shares
- **Case Sensitivity:**
  - Windows: Case-insensitive path matching
  - Unix/Linux: Case-sensitive path matching
  - macOS: Case-insensitive by default, case-sensitive option available
- **Path Validation:**
  - Validate paths exist on current OS before operations
  - Handle symlinks and junction points appropriately
  - Support relative paths with proper resolution
- **Migration Support:**
  - Detect OS changes and update path formats
  - Handle project moves across different OS environments
  - Maintain path consistency during cross-platform usage

---

## 10. Index Synchronization (URGENT)
- **Enhanced Index Structure:**
  ```json
  {
    "projects": [
      {
        "projectRoot": "/path/to/project",
        "route": "../../",
        "commandNames": ["build", "test", "start"],
        "lastUpdated": "2024-01-01T00:00:00Z",
        "status": "active|orphaned|moved"
      }
    ]
  }
  ```
- **Synchronization Commands:**
  - `codestate sync` - Rebuild index from all project files
  - `codestate migrate` - Update paths after project moves
  - `codestate validate` - Check index consistency
- **Automatic Index Updates:**
  - Update index atomically with every CRUD operation
  - Maintain index backup before each update
  - Handle index corruption with recovery mechanisms
- **Performance Optimization:**
  - O(1) lookup for script names across projects
  - Batch operations for multiple script changes
  - Lazy loading for large index files
- **Consistency Guarantees:**
  - Index always reflects current file system state
  - Atomic updates prevent partial index states
  - Rollback capability for failed index updates

---

## 11. Summary Table

| Area         | Approach/Best Practice                  |
|--------------|-----------------------------------------|
| Storage      | User data dir, hidden, secure perms     |
| Atomicity    | Temp file + rename, no partial writes   |
| Encryption   | AES-256-GCM, key in config, never code  |
| Indexing     | Index file, atomic update, backup       |
| CRUD         | Atomic, validated, encrypted, backed up |
| Validation   | Zod schema, versioned, migratable       |
| Security     | Path validation, logging, no root files |
| Extensibility| Extensions field, plugin support        |
| Testing      | TDD/BDD, property/fuzz, fixtures        |
| Multi-OS     | POSIX normalization, OS-specific ops    |
| Index Sync   | Enhanced structure, atomic updates      |

---

## 12. Future-Proofing
- **Configurable dataDir:** Field exists in config for future override support.
- **Plugin/extensions:** All schemas support extensions for future features.
- **Migration scripts:** Versioning enables easy upgrades.
- **DB migration:** If needed, architecture allows migration to a DB later.
- **Cross-platform compatibility:** Robust path handling for multi-OS environments.
- **Index scalability:** Enhanced indexing for large-scale script management.

---

**This document is the definitive reference for codestate file storage. All contributors and maintainers should consult it before making changes to storage, encryption, or CRUD logic.** 