import { useCallback, useEffect, useState } from 'react';
import type { AppUser, OrganizationalAssignment, UserRole } from '@countcard/core/types/auth';
import type { UserProfileDocument } from '@countcard/core/types/models';
import { getUserProfileById } from '@countcard/firebase/services/userProfiles';
import { requireAuth } from '@/lib/firebase';

type FirebaseUserLike = {
  uid: string;
  getIdTokenResult: () => Promise<{ claims: Record<string, unknown> }>;
} | null;

const refreshListeners = new Set<() => void>();
let refreshVersion = 0;

/** Re-fetch profile + ID token claims for all mounted useAppUser hooks. */
export function refreshAppUser(): void {
  refreshVersion += 1;
  refreshListeners.forEach((listener) => listener());
}

async function loadAppUser(
  firebaseUser: NonNullable<FirebaseUserLike>
): Promise<AppUser> {
  const [profileDoc, tokenResult] = await Promise.all([
    getUserProfileById(firebaseUser.uid),
    firebaseUser.getIdTokenResult(),
  ]);

  const profile = profileDoc as UserProfileDocument | null;
  const customClaims = {
    role: tokenResult.claims.role as UserRole | undefined,
    organizationalAssignment: tokenResult.claims.organizationalAssignment as
      | OrganizationalAssignment
      | undefined,
  };

  return {
    ...(firebaseUser as AppUser),
    profile: profile ? (profile as unknown as AppUser['profile']) : undefined,
    customClaims,
  };
}

export function useAppUser(firebaseUser: FirebaseUserLike): {
  appUser: AppUser | null;
  loading: boolean;
  refresh: () => void;
} {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(refreshVersion);

  const refresh = useCallback(() => {
    refreshAppUser();
  }, []);

  useEffect(() => {
    const onRefresh = () => setVersion(refreshVersion);
    refreshListeners.add(onRefresh);
    return () => {
      refreshListeners.delete(onRefresh);
    };
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setAppUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void loadAppUser(firebaseUser)
      .then((next) => {
        if (!cancelled) setAppUser(next);
      })
      .catch(() => {
        if (!cancelled) setAppUser(firebaseUser as AppUser);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, version]);

  return { appUser, loading, refresh };
}

export async function refreshAuthToken(): Promise<void> {
  await requireAuth().currentUser?.getIdToken(true);
}
