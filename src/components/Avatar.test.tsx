import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('renders image when photoUrl is provided', () => {
    render(<Avatar photoUrl="/test.png" name="Alice" />);
    const img = screen.getByAltText('Alice') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.tagName.toLowerCase()).toBe('img');
  });

  it('falls back to initial when no photoUrl', () => {
    render(<Avatar name="Bob" />);
    expect(screen.getByLabelText('Bob')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
  });
});

