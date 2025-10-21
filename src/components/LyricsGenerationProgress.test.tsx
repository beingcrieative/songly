import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LyricsGenerationProgress } from './LyricsGenerationProgress';

describe('LyricsGenerationProgress', () => {
  it('renders nothing when isGenerating is false', () => {
    const { container } = render(
      <LyricsGenerationProgress isGenerating={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders generation message when isGenerating is true', () => {
    render(<LyricsGenerationProgress isGenerating={true} />);

    expect(screen.getByText('Lyrics worden gegenereerd')).toBeInTheDocument();
    expect(screen.getByText('Suno AI schrijft 2 unieke versies van je liedje...')).toBeInTheDocument();
    expect(screen.getByText(/Dit duurt ongeveer 30-45 seconden/)).toBeInTheDocument();
  });

  it('renders refinement message when isRefining is true', () => {
    render(<LyricsGenerationProgress isGenerating={true} isRefining={true} />);

    expect(screen.getByText('Lyrics worden verfijnd')).toBeInTheDocument();
    expect(screen.getByText('Suno verwerkt je feedback...')).toBeInTheDocument();
    expect(screen.getByText(/Dit duurt ongeveer 30-40 seconden/)).toBeInTheDocument();
  });

  it('shows polling attempts when provided', () => {
    render(<LyricsGenerationProgress isGenerating={true} pollingAttempts={5} />);

    expect(screen.getByText('Poging 5 van 24')).toBeInTheDocument();
  });

  it('shows cancel button after 12 polling attempts', () => {
    const onCancel = vi.fn();
    render(
      <LyricsGenerationProgress
        isGenerating={true}
        pollingAttempts={13}
        onCancel={onCancel}
      />
    );

    const cancelButton = screen.getByText('Annuleren');
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not show cancel button before 12 polling attempts', () => {
    const onCancel = vi.fn();
    render(
      <LyricsGenerationProgress
        isGenerating={true}
        pollingAttempts={10}
        onCancel={onCancel}
      />
    );

    expect(screen.queryByText('Annuleren')).not.toBeInTheDocument();
  });

  it('does not show cancel button if onCancel is not provided', () => {
    render(
      <LyricsGenerationProgress
        isGenerating={true}
        pollingAttempts={15}
      />
    );

    expect(screen.queryByText('Annuleren')).not.toBeInTheDocument();
  });

  it('renders correct emoji for generation vs refinement', () => {
    const { rerender, container } = render(
      <LyricsGenerationProgress isGenerating={true} />
    );

    // Check for the main icon (with animate-pulse class)
    const mainIcon = container.querySelector('.text-6xl.animate-pulse');
    expect(mainIcon).toBeInTheDocument();
    expect(mainIcon?.textContent).toBe('✨');

    rerender(<LyricsGenerationProgress isGenerating={true} isRefining={true} />);

    const refinedIcon = container.querySelector('.text-6xl.animate-pulse');
    expect(refinedIcon).toBeInTheDocument();
    expect(refinedIcon?.textContent).toBe('🔄');
  });
});
