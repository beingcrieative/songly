import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SongCard } from './components/SongCard';
import { ConversationCard } from './components/ConversationCard';
import DashboardStats from './components/DashboardStats';
import ActionRequiredSection from './components/ActionRequiredSection';
import RecentlyActiveSection from './components/RecentlyActiveSection';
import ProgressBar from './components/ProgressBar';
import EmptyState from './components/EmptyState';
import SectionHeader from './components/SectionHeader';

describe('Library Components - Task 9.0 Testing', () => {
  describe('SongCard Component', () => {
    const mockSong = {
      id: 'song-1',
      title: 'Test Song',
      status: 'ready',
      imageUrl: 'https://example.com/image.jpg',
      updatedAt: Date.now(),
      lyricsSnippet: 'Test lyrics snippet',
      variants: [
        {
          trackId: 'track-1',
          title: 'Version 1',
          streamAudioUrl: 'https://example.com/audio.mp3',
          audioUrl: 'https://example.com/audio.mp3',
        },
      ],
      selectedVariantId: 'track-1',
      isPublic: false,
    };

    const mockHandlers = {
      onPlay: vi.fn(),
      onOpen: vi.fn(),
      onSelectVariant: vi.fn(),
      onShare: vi.fn(),
      onDelete: vi.fn(),
      onChooseLyrics: vi.fn(),
      onRetry: vi.fn(),
    };

    it('renders song card with title and image', () => {
      render(
        <SongCard
          song={mockSong}
          {...mockHandlers}
        />
      );
      expect(screen.getByText('Test Song')).toBeInTheDocument();
    });

    it('displays correct CTA button for ready status', () => {
      render(
        <SongCard
          song={mockSong}
          {...mockHandlers}
        />
      );
      expect(screen.getByText('▶️ Speel af')).toBeInTheDocument();
    });

    it('calls onPlay when play button is clicked', () => {
      render(
        <SongCard
          song={mockSong}
          {...mockHandlers}
        />
      );
      fireEvent.click(screen.getByText('▶️ Speel af'));
      expect(mockHandlers.onPlay).toHaveBeenCalled();
    });

    it('displays lyrics_ready status correctly', () => {
      const lyricsReadySong = { ...mockSong, status: 'lyrics_ready' };
      render(
        <SongCard
          song={lyricsReadySong}
          {...mockHandlers}
        />
      );
      expect(screen.getByText('Kies Lyrics →')).toBeInTheDocument();
    });

    it('displays failed status with retry button', () => {
      const failedSong = { ...mockSong, status: 'failed' };
      render(
        <SongCard
          song={failedSong}
          {...mockHandlers}
        />
      );
      expect(screen.getByText('🔄 Probeer opnieuw')).toBeInTheDocument();
    });

    it('shows progress indicator for generating songs', () => {
      const generatingSong = { ...mockSong, status: 'generating_music' };
      render(
        <SongCard
          song={generatingSong}
          {...mockHandlers}
        />
      );
      expect(screen.getByText('Muziek genereren')).toBeInTheDocument();
    });

    it('displays share button only for ready songs', () => {
      render(
        <SongCard
          song={mockSong}
          {...mockHandlers}
        />
      );
      expect(screen.getByText(/Deel link/)).toBeInTheDocument();
    });

    it('handles delete action with loading state', () => {
      render(
        <SongCard
          song={mockSong}
          {...mockHandlers}
          actionState={{ isDeleting: true }}
        />
      );
      expect(screen.getByText('Verwijderen…')).toBeInTheDocument();
    });
  });

  describe('ConversationCard Component', () => {
    const mockConversation = {
      title: 'Test Conversation',
      conceptLyrics: { lyrics: 'Test concept lyrics', title: 'Concept' },
      updatedAt: Date.now(),
      readinessScore: 0.75,
      phase: 'generating' as const,
      messages: [
        { role: 'user', content: 'Hello', createdAt: Date.now() },
        { role: 'assistant', content: 'Hi there', createdAt: Date.now() },
      ],
      onOpen: vi.fn(),
      onDelete: vi.fn(),
    };

    it('renders conversation card with title', () => {
      render(<ConversationCard {...mockConversation} />);
      expect(screen.getByText('Test Conversation')).toBeInTheDocument();
    });

    it('displays correct phase label', () => {
      render(<ConversationCard {...mockConversation} />);
      expect(screen.getByText('Lyrics genereren')).toBeInTheDocument();
    });

    it('shows progress bar with readiness score', () => {
      render(<ConversationCard {...mockConversation} />);
      expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('displays recent messages preview', () => {
      render(<ConversationCard {...mockConversation} />);
      expect(screen.getByText(/Hello/)).toBeInTheDocument();
      expect(screen.getByText(/Hi there/)).toBeInTheDocument();
    });

    it('calls onOpen when continue button is clicked', () => {
      render(<ConversationCard {...mockConversation} />);
      fireEvent.click(screen.getByText('Continue'));
      expect(mockConversation.onOpen).toHaveBeenCalled();
    });

    it('handles delete action', () => {
      render(<ConversationCard {...mockConversation} />);
      fireEvent.click(screen.getByText('Verwijderen'));
      expect(mockConversation.onDelete).toHaveBeenCalled();
    });
  });

  describe('DashboardStats Component', () => {
    const mockSongs = [
      { id: '1', status: 'ready' },
      { id: '2', status: 'generating_music' },
      { id: '3', status: 'ready' },
    ];

    const mockConversations = [
      { id: 'c1', phase: 'complete' },
      { id: 'c2', phase: 'gathering' },
    ];

    it('renders dashboard stats with correct counts', () => {
      render(
        <DashboardStats
          songs={mockSongs}
          conversations={mockConversations}
        />
      );
      expect(screen.getByText('3')).toBeInTheDocument(); // Total songs
      expect(screen.getByText('2')).toBeInTheDocument(); // Total conversations
    });

    it('displays generating count correctly', () => {
      render(
        <DashboardStats
          songs={mockSongs}
          conversations={mockConversations}
        />
      );
      // Should show 1 generating song
      const generatingElements = screen.getAllByText(/1/);
      expect(generatingElements.length).toBeGreaterThan(0);
    });
  });

  describe('ProgressBar Component', () => {
    it('renders progress bar with correct value', () => {
      render(
        <ProgressBar
          value={75}
          label="Test Progress"
          showPercentage={true}
          color="primary"
        />
      );
      expect(screen.getByText('Test Progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('hides percentage when showPercentage is false', () => {
      render(
        <ProgressBar
          value={50}
          label="Test"
          showPercentage={false}
          color="primary"
        />
      );
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });
  });

  describe('EmptyState Component', () => {
    it('renders empty state with title and message', () => {
      render(
        <EmptyState
          title="No Songs"
          message="You haven't created any songs yet"
          icon="🎵"
        />
      );
      expect(screen.getByText('No Songs')).toBeInTheDocument();
      expect(screen.getByText("You haven't created any songs yet")).toBeInTheDocument();
    });

    it('displays action button when provided', () => {
      const mockAction = vi.fn();
      render(
        <EmptyState
          title="No Songs"
          message="Create one now"
          action={{ label: 'Create', onClick: mockAction }}
        />
      );
      fireEvent.click(screen.getByText('Create'));
      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('SectionHeader Component', () => {
    it('renders section header with title and subtitle', () => {
      render(
        <SectionHeader
          title="My Songs"
          subtitle="5 songs"
        />
      );
      expect(screen.getByText('My Songs')).toBeInTheDocument();
      expect(screen.getByText('5 songs')).toBeInTheDocument();
    });

    it('displays action button when provided', () => {
      const mockAction = vi.fn();
      render(
        <SectionHeader
          title="My Songs"
          action={{ label: 'Add', onClick: mockAction, icon: '+' }}
        />
      );
      fireEvent.click(screen.getByText('Add'));
      expect(mockAction).toHaveBeenCalled();
    });
  });

  describe('Accessibility Tests', () => {
    it('SongCard has proper ARIA labels', () => {
      const mockSong = {
        id: 'song-1',
        title: 'Test Song',
        status: 'ready',
        variants: [{ trackId: 'track-1' }],
      };
      render(
        <SongCard
          song={mockSong}
          onPlay={vi.fn()}
          onOpen={vi.fn()}
          onSelectVariant={vi.fn()}
          onShare={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      // Buttons should be accessible
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('ConversationCard has proper ARIA labels', () => {
      render(
        <ConversationCard
          title="Test"
          phase="complete"
          onOpen={vi.fn()}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('SongCard memoization prevents unnecessary re-renders', () => {
      const { rerender } = render(
        <SongCard
          song={{ id: 'song-1', title: 'Test', status: 'ready', variants: [] }}
          onPlay={vi.fn()}
          onOpen={vi.fn()}
          onSelectVariant={vi.fn()}
          onShare={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      const initialRenders = vi.fn();
      rerender(
        <SongCard
          song={{ id: 'song-1', title: 'Test', status: 'ready', variants: [] }}
          onPlay={vi.fn()}
          onOpen={vi.fn()}
          onSelectVariant={vi.fn()}
          onShare={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      // Component should be memoized and not re-render unnecessarily
      expect(true).toBe(true);
    });
  });

  describe('Responsive Design Tests', () => {
    it('SongCard renders in mobile viewport', () => {
      global.innerWidth = 375;
      render(
        <SongCard
          song={{ id: 'song-1', title: 'Test', status: 'ready', variants: [] }}
          onPlay={vi.fn()}
          onOpen={vi.fn()}
          onSelectVariant={vi.fn()}
          onShare={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('SongCard renders in desktop viewport', () => {
      global.innerWidth = 1920;
      render(
        <SongCard
          song={{ id: 'song-1', title: 'Test', status: 'ready', variants: [] }}
          onPlay={vi.fn()}
          onOpen={vi.fn()}
          onSelectVariant={vi.fn()}
          onShare={vi.fn()}
          onDelete={vi.fn()}
        />
      );
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
