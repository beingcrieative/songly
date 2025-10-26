import { db } from '@/lib/db';
import { useMemo } from 'react';

export function useActionItemsCount(userId: string | undefined) {
  const query = useMemo(() => {
    if (!userId) return {};

    return {
      songs: {
        $: {
          where: {
            'user.id': userId,
            status: { in: ['lyrics_ready', 'ready'] } as any,
          },
        },
      },
    };
  }, [userId]);

  const { data } = db.useQuery(query);

  return data?.songs?.length ?? 0;
}
