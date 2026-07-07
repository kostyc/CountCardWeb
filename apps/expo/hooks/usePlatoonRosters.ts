import { useEffect, useMemo, useState } from 'react';
import { listRecruits } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import type { Regiment } from '@countcard/core/types/auth';

interface OrgScope {
  regiment?: Regiment;
  battalion?: string;
  company?: string;
}

export function usePlatoonRosters(platoons: string[], org?: OrgScope) {
  const [rosterByPlatoon, setRosterByPlatoon] = useState<Record<string, RecruitProfile[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedPlatoons = useMemo(
    () => [...new Set(platoons.map((p) => p.trim()).filter(Boolean))],
    [platoons]
  );

  const platoonKey = useMemo(
    () => [...normalizedPlatoons].sort().join('|'),
    [normalizedPlatoons]
  );

  const orgKey = useMemo(
    () => [org?.regiment ?? '', org?.battalion ?? '', org?.company ?? ''].join('|'),
    [org?.regiment, org?.battalion, org?.company]
  );

  useEffect(() => {
    const unique = platoonKey ? platoonKey.split('|') : [];
    if (!unique.length) {
      setRosterByPlatoon({});
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const entries = await Promise.all(
          unique.map(async (platoon) => {
            const result = await listRecruits(
              {
                regiment: org?.regiment,
                battalion: org?.battalion,
                company: org?.company,
                platoon,
              },
              { pageSize: 500 }
            );
            return [platoon, result.items] as const;
          })
        );
        if (cancelled) return;
        setRosterByPlatoon(Object.fromEntries(entries));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load roster');
          setRosterByPlatoon({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [platoonKey, orgKey]);

  return { rosterByPlatoon, loading, error };
}
