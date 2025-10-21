import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { ParameterSheet, type ParameterValues, type ParameterSheetExtras, type ParameterSheetTemplate } from "./ParameterSheet";
import { I18nProvider } from '@/providers/I18nProvider';

describe("ParameterSheet", () => {
  const defaultValues: ParameterValues = {
    language: "Nederlands",
    vocalGender: "neutral",
  };

  const defaultExtras: ParameterSheetExtras = {
    title: "Ons lied",
    selectedTemplateId: "template-1",
    instrumental: false,
    styleWeight: 0.5,
    weirdnessConstraint: 0.2,
    audioWeight: 0.6,
  };

  const templates: ParameterSheetTemplate[] = [
    { id: "template-1", name: "Template 1" },
    { id: "template-2", name: "Template 2" },
  ];

  const noop = () => {};

  const renderSheet = (ui: React.ReactElement) => render(<I18nProvider>{ui}</I18nProvider>);

  it("does not render when closed", () => {
    renderSheet(
      <ParameterSheet
        isOpen={false}
        defaults={defaultValues}
        extras={defaultExtras}
        templates={templates}
        onClose={noop}
        onConfirm={noop}
      />
    );

    expect(screen.queryByText("Parameters")).not.toBeInTheDocument();
  });

  it("calls onClose when annuleren is clicked", () => {
    const handleClose = vi.fn();
    renderSheet(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        extras={defaultExtras}
        templates={templates}
        onClose={handleClose}
        onConfirm={noop}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Annuleren" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("closes when overlay or escape is used", () => {
    const handleClose = vi.fn();
    renderSheet(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        extras={defaultExtras}
        templates={templates}
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
    const { rerender } = renderSheet(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        extras={defaultExtras}
        templates={templates}
        onClose={handleClose}
        onConfirm={noop}
      />
    );

    rerender(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        extras={defaultExtras}
        templates={templates}
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

    renderSheet(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        extras={defaultExtras}
        templates={templates}
        onClose={noop}
        onConfirm={handleConfirm}
      />
    );

    fireEvent.change(screen.getByLabelText("Taal"), {
      target: { value: "English" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Man" }));
    fireEvent.change(screen.getByLabelText("Vocale leeftijd/klank"), {
      target: { value: "deep" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    const call = handleConfirm.mock.calls[0];
    expect(call[0]).toEqual({
      language: "English",
      vocalGender: "male",
      vocalAge: "deep",
    });
    expect(call[1]).toMatchObject({
      title: defaultExtras.title,
      selectedTemplateId: defaultExtras.selectedTemplateId,
      instrumental: defaultExtras.instrumental,
    });
  });

  it("disables bevestigen when language is blank", () => {
    const handleConfirm = vi.fn();
    renderSheet(
      <ParameterSheet
        isOpen
        defaults={{ language: "   ", vocalGender: "neutral" }}
        languages={["   ", "Nederlands"]}
        extras={defaultExtras}
        templates={templates}
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
    renderSheet(
      <ParameterSheet
        isOpen
        defaults={{ language: "Nederlands", vocalGender: "neutral", vocalAge: "mature" }}
        extras={defaultExtras}
        templates={templates}
        onClose={noop}
        onConfirm={handleConfirm}
      />
    );

    fireEvent.change(screen.getByLabelText("Vocale leeftijd/klank"), {
      target: { value: "" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Bevestigen" }));

    expect(handleConfirm).toHaveBeenCalledWith({
      language: "Nederlands",
      vocalGender: "neutral",
      vocalAge: undefined,
    }, expect.any(Object));
  });

  it("keeps confirm disabled while submitting", () => {
    renderSheet(
      <ParameterSheet
        isOpen
        defaults={defaultValues}
        extras={defaultExtras}
        templates={templates}
        onClose={noop}
        onConfirm={noop}
        isSubmitting
      />
    );

    expect(screen.getByRole("button", { name: "Bevestigen" })).toBeDisabled();
  });
});
