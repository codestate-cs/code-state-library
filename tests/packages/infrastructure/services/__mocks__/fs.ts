import { vi } from "vitest";

export const promises = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  open: vi.fn(),
  access: vi.fn(),
  copyFile: vi.fn(),
  rename: vi.fn(),
  unlink: vi.fn(),
};

export const constants = {
  F_OK: 0,
};
