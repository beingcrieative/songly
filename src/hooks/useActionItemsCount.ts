import { db } from '@/lib/db';
import { useMemo } from 'react';

/**
 * PRD-0016 FR-4.1 & FR-4.2: Count songs requiring user action
 * Actionable statuses: lyrics_ready, ready, failed
 */
export function useActionItemsCount(userId: string | undefined) {
  const query = useMemo(() => {
    if (!userId) return {};

    return {
      songs: {
        $: {
          where: {
            'user.id': userId,
            status: { in: ['lyrics_ready', 'ready', 'failed'] } as any,
          },
        },
      },
    };
  }, [userId]);

  const { data } = db.useQuery(query);

  return data?.songs?.length ?? 0;
}
