import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { vi } from "vitest";
import { ParameterSheet, type ParameterValues } from "./ParameterSheet";

describe("ParameterSheet", () => {
  const defaultValues: ParameterValues = {
    language: "Nederlands",
    vocalGender: "neutral",
  };

  const noop = () => {};

  it("does not render when closed", () => {
    render(
      <ParameterSheet
        isOpen={false}
        defaults={defaultValues}
        onClose={noop}
        onConfirm={noop}
      />
    );

    expect(screen.queryByText("Stembeleving instellen")).not.toBeInTheDocument();
  });

  it("calls onClose when annuleren is clicked", () => {
    const handleClose = vi.fn();
    render(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        onClose={handleClose}
        onConfirm={noop}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("closes when overlay or escape is used", () => {
    const handleClose = vi.fn();
    render(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        onClose={handleClose}
        onConfirm={noop}
      />
    );

    fireEvent.click(screen.getByRole("presentation"));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it("prevents overlay close while submitting", () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        onClose={handleClose}
        onConfirm={noop}
      />
    );

    rerender(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        onClose={handleClose}
        onConfirm={noop}
        isSubmitting
      />
    );

    fireEvent.click(screen.getByRole("presentation"));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("updates fields and submits selected values", () => {
    const handleConfirm = vi.fn();

    render(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        onClose={noop}
        onConfirm={handleConfirm}
      />
    );

    fireEvent.change(screen.getByLabelText("Taal"), {
      target: { value: "English" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Man" }));
    fireEvent.change(screen.getByLabelText("Vocale leeftijd / toon"), {
      target: { value: "deep" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(handleConfirm).toHaveBeenCalledWith({
      language: "English",
      vocalGender: "male",
      vocalAge: "deep",
    });
  });

  it("disables bevestigen when language is blank", () => {
    const handleConfirm = vi.fn();
    render(
      <ParameterSheet
        isOpen
        defaults={{ language: "   ", vocalGender: "neutral" }}
        languages={["   ", "Nederlands"]}
        onClose={noop}
        onConfirm={handleConfirm}
      />
    );

    const confirmButton = screen.getByRole("button", { name: "Bevestigen" });
    expect(confirmButton).toBeDisabled();

    // Selecting a valid language enables the button
    fireEvent.change(screen.getByLabelText("Taal"), {
      target: { value: "Nederlands" },
    });
    expect(confirmButton).toBeEnabled();
  });

  it("returns undefined vocalAge when 'Geen voorkeur' is selected", () => {
    const handleConfirm = vi.fn();
    render(
      <ParameterSheet
        isOpen
        defaults={{ language: "Nederlands", vocalGender: "neutral", vocalAge: "mature" }}
        onClose={noop}
        onConfirm={handleConfirm}
      />
    );

    fireEvent.change(screen.getByLabelText("Vocale leeftijd / toon"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(handleConfirm).toHaveBeenCalledWith({
      language: "Nederlands",
      vocalGender: "neutral",
      vocalAge: undefined,
    });
  });

  it("keeps confirm disabled while submitting", () => {
    render(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        onClose={noop}
        onConfirm={noop}
        isSubmitting
      />
    );

    expect(screen.getByRole("button", { name: "Bevestigen" })).toBeDisabled();
  });
});
