import React from "react";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const storageData = new Map();
const localStorageMock = {
  getItem: vi.fn((key) => (storageData.has(key) ? storageData.get(key) : null)),
  setItem: vi.fn((key, value) => {
    storageData.set(String(key), String(value));
  }),
  removeItem: vi.fn((key) => {
    storageData.delete(String(key));
  }),
  clear: vi.fn(() => {
    storageData.clear();
  }),
  key: vi.fn((index) => Array.from(storageData.keys())[index] ?? null),
  get length() {
    return storageData.size;
  },
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");

  return {
    ...actual,
    Link: ({ to, children, ...props }) => (
      <a href={typeof to === "string" ? to : String(to?.pathname ?? to ?? "") } {...props}>
        {children}
      </a>
    ),
  };
});

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

beforeEach(() => {
  localStorageMock.clear();
  document.body.innerHTML = '<div id="root"></div><div id="modal-root"></div>';

  if (window.HTMLDialogElement?.prototype) {
    if (!window.HTMLDialogElement.prototype.showModal) {
      window.HTMLDialogElement.prototype.showModal = vi.fn();
    }

    if (!window.HTMLDialogElement.prototype.close) {
      window.HTMLDialogElement.prototype.close = vi.fn();
    }
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

