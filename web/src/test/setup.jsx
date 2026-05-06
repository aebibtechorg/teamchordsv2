import React from "react";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

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

