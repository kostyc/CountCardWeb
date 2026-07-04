import { useEffect, useState } from 'react';
import type { AppUser, OrganizationalAssignment, UserRole } from '@countcard/core/types/auth';
import type { UserProfileDocument } from '@countcard/core/types/models';
import { getUserProfileById } from '@countcard/firebase/services/userProfiles';
import { requireAuth } from '@/lib/firebase';

export function useAppUser(firebaseUser: { uid: string; getIdTokenResult: () => Promise<{ claims: Record<string, unknown> }> } | null): {
  appUser: AppUser | null;
  loading: boolean;
} {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser) {
      setAppUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [profileDoc, tokenResult] = await Promise.all([
          getUserProfileById(firebaseUser.uid),
          firebaseUser.getIdTokenResult(),
        ]);
        if (cancelled) return;

        const profile = profileDoc as UserProfileDocument | null;
        const customClaims = {
          role: tokenResult.claims.role as UserRole | undefined,
          organizationalAssignment: tokenResult.claims.organizationalAssignment as
            | OrganizationalAssignment
            | undefined,
        };

        setAppUser({
          ...(firebaseUser as AppUser),
          profile: profile ? (profile as unknown as AppUser['profile']) : undefined,
          customClaims,
        });
      } catch {
        if (!cancelled) {
          setAppUser(firebaseUser as AppUser);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid]);

  return { appUser, loading };
}

export async function refreshAuthToken(): Promise<void> {
  await requireAuth().currentUser?.getIdToken(true);
}
