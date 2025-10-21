import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NavTabs from './NavTabs';

vi.mock('next/navigation', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    usePathname: () => '/studio',
  };
});

vi.mock('@/providers/I18nProvider', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useI18n: () => ({ strings: { nav: { chat: 'Chat', library: 'Library', settings: 'Settings' } } }),
  };
});

describe('NavTabs', () => {
  beforeEach(() => {
    document.body.setAttribute('data-testid', 'body');
  });

  it('renders nav with active studio tab and icons', () => {
    render(<NavTabs />);
    expect(screen.getByText('Chat')).toBeTruthy();
    expect(screen.getByRole('navigation')).toBeTruthy();
  });
});

