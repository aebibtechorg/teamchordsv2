import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ConfirmDialog from "./ConfirmDialog";

vi.mock("./Modal", () => ({
  default: ({ children }) => <div data-testid="modal">{children}</div>,
}));

describe("ConfirmDialog", () => {
  it("does not render when closed", () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete song"
        message="This action cannot be undone"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("confirms and closes the dialog", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete song"
        message="This action cannot be undone"
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    );

    expect(screen.getByRole("heading", { name: /delete song/i })).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

