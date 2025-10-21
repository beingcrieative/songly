import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatBubble from './ChatBubble';

describe('ChatBubble', () => {
  it('renders user bubble with gradient text color', () => {
    render(<ChatBubble role="user">Hallo</ChatBubble>);
    expect(screen.getByText('Hallo')).toBeTruthy();
    // aria-label helps identify role
    expect(screen.getByLabelText('Gebruiker bericht')).toBeTruthy();
  });

  it('renders assistant bubble with avatar', () => {
    render(<ChatBubble role="assistant" avatar={{ name: 'AI' }}>Hoi!</ChatBubble>);
    expect(screen.getByText('Hoi!')).toBeTruthy();
    expect(screen.getByLabelText('Assistent bericht')).toBeTruthy();
  });
});

