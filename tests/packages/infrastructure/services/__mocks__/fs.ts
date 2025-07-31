import { vi } from "vitest";

export const promises = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  open: jest.fn(),
  access: jest.fn(),
  copyFile: jest.fn(),
  rename: jest.fn(),
  unlink: jest.fn(),
};

export const constants = {
  F_OK: 0,
};
