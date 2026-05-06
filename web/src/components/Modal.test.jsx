import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Modal from "./Modal";

describe("Modal", () => {
  it("opens the dialog and closes when the backdrop is clicked", () => {
    const showModal = vi.spyOn(window.HTMLDialogElement.prototype, "showModal").mockImplementation(() => {});
    const onClose = vi.fn();

    const { container } = render(
      <Modal onClose={onClose}>
        <p>Modal content</p>
      </Modal>
    );

    const dialog = container.ownerDocument.getElementById("modal-root")?.querySelector("dialog");
    expect(dialog).toBeInTheDocument();
    expect(showModal).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/modal content/i)).toBeInTheDocument();

    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});





