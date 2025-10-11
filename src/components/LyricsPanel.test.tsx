import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { LyricsPanel } from "./LyricsPanel";
import { vi } from "vitest";

vi.mock("@/hooks/useLyricVersions", () => ({
  useLyricVersionsWithNotification: () => ({
    versions: [],
    latestVersion: null,
    isLoading: false,
    hasNewVersion: false,
  }),
}));

const baseProps = {
  conversationId: "conv-1",
  latestLyrics: { title: "Versie", lyrics: "regel 1\nregel 2", style: "" },
  onGenerateMusic: vi.fn(),
  onRefineLyrics: vi.fn(),
  onManualEditSave: vi.fn(),
  canGenerateMusic: false,
  canRefine: true,
  isGeneratingMusic: false,
  isRefining: false,
};

describe("LyricsPanel interactions", () => {
  beforeEach(() => {
    baseProps.onGenerateMusic.mockClear();
    baseProps.onRefineLyrics.mockClear();
    baseProps.onManualEditSave.mockClear();
  });

  it("disables music button when gating is false", () => {
    render(<LyricsPanel {...baseProps} />);
    const button = screen.getByRole("button", { name: /Genereer Muziek/i });
    expect(button).toBeDisabled();
  });

  it("enables music button when gating is true", () => {
    render(<LyricsPanel {...baseProps} canGenerateMusic={true} />);
    const button = screen.getByRole("button", { name: /Genereer Muziek/i });
    expect(button).toBeEnabled();
  });

  it("disables refine button when canRefine is false", () => {
    render(<LyricsPanel {...baseProps} canRefine={false} />);
    const button = screen.getByRole("button", { name: /Verfijn lyrics/i });
    expect(button).toBeDisabled();
  });

  it("calls onManualEditSave with edited text", () => {
    render(<LyricsPanel {...baseProps} canGenerateMusic={true} />);
    fireEvent.click(screen.getByRole("button", { name: /Bewerk lyrics/i }));
    const textarea = screen.getByPlaceholderText(/Schrijf hier je aangepaste lyrics/i);
    fireEvent.change(textarea, { target: { value: "Nieuwe tekst" } });
    fireEvent.click(screen.getByRole("button", { name: /Opslaan/i }));
    expect(baseProps.onManualEditSave).toHaveBeenCalledWith("Nieuwe tekst");
  });
});

