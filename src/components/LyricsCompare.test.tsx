import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { LyricsCompare } from "./LyricsCompare";

describe("LyricsCompare", () => {
  const baseOptions = ["Option A", "Option B"];

  it("renders variant labels", () => {
    render(
      <LyricsCompare
        options={baseOptions}
        selectedIndex={null}
        onSelect={() => {}}
        onUseSelected={() => {}}
      />
    );
    expect(screen.getByText("Versie A")).toBeInTheDocument();
    expect(screen.getByText("Versie B")).toBeInTheDocument();
  });

  it("fires onSelect when a radio is clicked", () => {
    let selected: number | null = null;
    const handleSelect = (index: number) => {
      selected = index;
    };

    render(
      <LyricsCompare
        options={baseOptions}
        selectedIndex={null}
        onSelect={handleSelect}
        onUseSelected={() => {}}
      />
    );

    const optionB = screen.getByLabelText("Versie B");
    fireEvent.click(optionB);

    expect(selected).toBe(1);
  });

  it("disables CTA when nothing is selected", () => {
    render(
      <LyricsCompare
        options={baseOptions}
        selectedIndex={null}
        onSelect={() => {}}
        onUseSelected={() => {}}
      />
    );
    const button = screen.getByRole("button", { name: /Gebruik geselecteerde lyrics/i });
    expect(button).toBeDisabled();
  });

  it("enables CTA once a variant is selected", () => {
    render(
      <LyricsCompare
        options={baseOptions}
        selectedIndex={1}
        onSelect={() => {}}
        onUseSelected={() => {}}
      />
    );
    const button = screen.getByRole("button", { name: /Gebruik geselecteerde lyrics/i });
    expect(button).toBeEnabled();
  });

  it("disables CTA while saving selection", () => {
    render(
      <LyricsCompare
        options={baseOptions}
        selectedIndex={1}
        onSelect={() => {}}
        onUseSelected={() => {}}
        isSaving
      />
    );
    const button = screen.getByRole("button", { name: /Gebruik geselecteerde lyrics/i });
    expect(button).toBeDisabled();
  });
});
