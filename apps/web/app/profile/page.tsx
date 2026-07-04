'use client';

/**
 * Profile Page
 * User profile page displaying user information, privacy settings, and account linking
 */

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import UserMenu from '@/components/layout/UserMenu';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AccountLinking from '@/components/profile/AccountLinking';
import EncryptionKeyManagement from '@/components/profile/EncryptionKeyManagement';
import { debugLog } from '@/lib/utils/debugLogger';
import { useToast } from '@/context/ToastContext';
import { authenticatedFetch } from '@/lib/api/clientAuth';
import { uploadProfilePicture, deleteProfilePicture } from '@/lib/storage/profilePicture';
import { uploadLogo, deleteLogoUrl } from '@/lib/storage/logoUpload';
import { BATTALIONS, BATTALION_LOGO_PATHS } from '@/lib/constants/organizations';
import type { Battalion } from '@/lib/validation/organizationSchemas';

function isFirebaseStorageUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'firebasestorage.googleapis.com';
  } catch {
    return false;
  }
}

export default function ProfilePage(): JSX.Element {
  const { user, loading, initialized, refreshUser } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [privacy, setPrivacy] = useState({
    showProfilePicture: true,
    showContactToSameCompany: false,
  });
  const [privacySaving, setPrivacySaving] = useState(false);
  const [pictureSaving, setPictureSaving] = useState(false);
  const [logoUrls, setLogoUrls] = useState({
    profilePictureUrl: null as string | null,
    companyLogoUrl: null as string | null,
    battalionLogoUrl: null as string | null,
  });
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  const [showSharedLogosModal, setShowSharedLogosModal] = useState(false);
  const [sharedLogos, setSharedLogos] = useState<Array<{ logoId: string; logoUrl: string; metadata?: { fileName?: string; uploadedAt?: string }; createdBy?: string }>>([]);
  const [sharedLogosLoading, setSharedLogosLoading] = useState(false);
  const [profilePhotoLoadError, setProfilePhotoLoadError] = useState(false);
  const [profilePhotoObjectUrl, setProfilePhotoObjectUrl] = useState<string | null>(null);
  const [profilePhotoApiFailed, setProfilePhotoApiFailed] = useState(false);

  useEffect(() => {
    if (user?.profile?.privacy) {
      setPrivacy((prev) => ({
        ...prev,
        showProfilePicture: user.profile!.privacy?.showProfilePicture ?? true,
        showContactToSameCompany: user.profile!.privacy?.showContactToSameCompany ?? false,
      }));
    }
  }, [user?.profile?.privacy]);

  useEffect(() => {
    if (user?.profile) {
      setLogoUrls((prev) => ({
        profilePictureUrl: user.profile!.profilePictureUrl ?? user.profile!.photoURL ?? prev.profilePictureUrl ?? null,
        companyLogoUrl: user.profile!.companyLogoUrl ?? prev.companyLogoUrl ?? null,
        battalionLogoUrl: user.profile!.battalionLogoUrl ?? prev.battalionLogoUrl ?? null,
      }));
    }
  }, [user?.profile?.profilePictureUrl, user?.profile?.photoURL, user?.profile?.companyLogoUrl, user?.profile?.battalionLogoUrl]);

  useEffect(() => {
    debugLog.info('Profile page mounted', 'ProfilePage', {
      hasUser: !!user,
      loading,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
      timestamp: new Date().toISOString(),
    });
  }, [user, loading]);

  useEffect(() => {
    setProfilePhotoLoadError(false);
  }, [user?.profile?.profilePictureUrl, user?.profile?.photoURL, logoUrls.profilePictureUrl]);

  useEffect(() => {
    const photoUrl = logoUrls.profilePictureUrl ?? user?.profile?.profilePictureUrl ?? user?.profile?.photoURL ?? user?.photoURL ?? null;
    if (!user || !photoUrl) {
      setProfilePhotoApiFailed(false);
      setProfilePhotoObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    setProfilePhotoApiFailed(false);
    let cancelled = false;
    (async () => {
      try {
        const res = await authenticatedFetch('/api/user/profile/photo');
        if (cancelled) return;
        if (!res.ok) {
          if (!cancelled) {
            setProfilePhotoApiFailed(true);
            try {
              const data = await res.json().catch(() => ({})) as { error?: string; detail?: string };
              const message = data.detail ? `${data.error ?? 'Error'}: ${data.detail}` : (data.error ?? 'Profile photo failed to load.');
              showToast({ variant: 'error', message });
            } catch {
              showToast({ variant: 'error', message: 'Profile photo failed to load.' });
            }
          }
          return;
        }
        const blob = await res.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setProfilePhotoObjectUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setProfilePhotoObjectUrl(null);
          setProfilePhotoApiFailed(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      setProfilePhotoObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [user, logoUrls.profilePictureUrl, user?.profile?.profilePictureUrl, user?.profile?.photoURL, user?.photoURL, showToast]);

  const handlePrivacyChange = async (field: 'showProfilePicture' | 'showContactToSameCompany', value: boolean) => {
    const next = { ...privacy, [field]: value };
    setPrivacy(next);
    if (!user) return;
    setPrivacySaving(true);
    try {
      const res = await authenticatedFetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacy: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new Error(data.detail ?? data.error ?? 'Failed to save');
      }
      showToast({ variant: 'success', message: 'Privacy settings saved.' });
    } catch (err) {
      showToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to save privacy settings.' });
      setPrivacy(privacy);
    } finally {
      setPrivacySaving(false);
    }
  };

  const saveProfilePictureUrl = async (url: string | null) => {
    if (!user) return;
    try {
      const res = await authenticatedFetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePictureUrl: url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new Error(data.detail ?? data.error ?? 'Failed to save');
      }
      setLogoUrls((prev) => ({ ...prev, profilePictureUrl: url }));
      await refreshUser();
      showToast({ variant: 'success', message: url ? 'Profile picture updated.' : 'Profile picture removed.' });
    } catch (err) {
      showToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to save profile picture.' });
    }
  };

  const saveLogoUrl = async (field: 'companyLogoUrl' | 'battalionLogoUrl', url: string | null) => {
    if (!user) return;
    try {
      const res = await authenticatedFetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: url }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new Error(data.detail ?? data.error ?? 'Failed to save');
      }
      setLogoUrls((prev) => ({ ...prev, [field]: url }));
      await refreshUser();
      showToast({ variant: 'success', message: url ? 'Logo updated.' : 'Logo removed.' });
    } catch (err) {
      showToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to save logo.' });
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    setPictureSaving(true);
    try {
      const url = await uploadProfilePicture(user.uid, file);
      await saveProfilePictureUrl(url);
    } catch (err) {
      showToast({ variant: 'error', message: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setPictureSaving(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    const url = logoUrls.profilePictureUrl || getPhotoUrl();
    if (!url || !user) return;
    setPictureSaving(true);
    const ok = await deleteProfilePicture(user.uid, url);
    setPictureSaving(false);
    if (ok) await saveProfilePictureUrl(null);
    else showToast({ variant: 'error', message: 'Failed to remove picture.' });
  };

  const handleLogoUpload = async (type: 'company' | 'battalion', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = '';
    try {
      const url = await uploadLogo(type, user.uid, file);
      if (url) {
        await saveLogoUrl(type === 'company' ? 'companyLogoUrl' : 'battalionLogoUrl', url);
        if (type === 'company') {
          const registerRes = await authenticatedFetch('/api/logos/company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              logoUrl: url,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
            }),
          });
          if (!registerRes.ok) {
            const err = await registerRes.json().catch(() => ({}));
            showToast({
              variant: 'error',
              message: (err as { error?: string }).error ?? 'Logo saved; sharing to company failed.',
            });
          }
        }
      } else {
        showToast({ variant: 'error', message: 'Logo upload failed.' });
      }
    } catch (err) {
      showToast({ variant: 'error', message: err instanceof Error ? err.message : 'Logo upload failed.' });
    }
  };

  const handleRemoveLogo = async (type: 'company' | 'battalion') => {
    const field = type === 'company' ? 'companyLogoUrl' : 'battalionLogoUrl';
    const url = logoUrls[field];
    if (!url || !user) return;
    const isPresetPath = url.startsWith('/');
    if (!isPresetPath) {
      const ok = await deleteLogoUrl(url);
      if (!ok) {
        showToast({ variant: 'error', message: 'Failed to remove logo.' });
        return;
      }
    }
    await saveLogoUrl(field, null);
  };

  const handleSelectBattalionLogo = async (battalion: Battalion) => {
    const path = BATTALION_LOGO_PATHS[battalion];
    if (!path || !user) return;
    await saveLogoUrl('battalionLogoUrl', path);
  };

  const handleOpenSharedLogos = async () => {
    if (!user) return;
    setShowSharedLogosModal(true);
    setSharedLogosLoading(true);
    setSharedLogos([]);
    try {
      const res = await authenticatedFetch('/api/logos/company');
      const data = await res.json();
      if (res.ok && Array.isArray(data.logos)) {
        setSharedLogos(data.logos);
      }
    } finally {
      setSharedLogosLoading(false);
    }
  };

  const handleSelectSharedLogo = async (logoUrl: string) => {
    await saveLogoUrl('companyLogoUrl', logoUrl);
    setShowSharedLogosModal(false);
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !loading && !user) {
      debugLog.warn('Profile: User not authenticated, redirecting to login', 'ProfilePage');
      router.push('/login');
    }
  }, [user, loading, initialized, router]);

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent"></div>
          <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent"></div>
          <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  /**
   * Get user display name
   */
  const getDisplayName = (): string => {
    if (user.profile?.displayName) {
      return user.profile.displayName;
    }
    if (user.displayName) {
      return user.displayName;
    }
    if (user.email) {
      return user.email;
    }
    return 'User';
  };

  /**
   * Get user photo URL
   */
  const getPhotoUrl = (): string | null => {
    return user.profile?.profilePictureUrl || user.profile?.photoURL || user.photoURL || null;
  };

  /**
   * Get user avatar/initials
   */
  const getAvatarContent = (): string => {
    if (user.profile?.displayName) {
      const parts = user.profile.displayName.split(' ');
      if (parts.length >= 2) {
        return parts[parts.length - 1].charAt(0).toUpperCase();
      }
    }
    if (user.profile?.firstName && user.profile?.lastName) {
      return user.profile.lastName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-background-primary-light dark:bg-background-primary-dark">
      <Header
        title="CountCard"
        titleHref="/dashboard"
        userMenu={<UserMenu />}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-text-heading-light dark:text-text-heading-dark">
              Profile
            </h1>
            <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">
              Manage your account information and linked authentication providers
            </p>
          </div>

          {/* Profile Information Card */}
          <Card elevation="base" padding="lg">
            <Card.Header>
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Profile Information
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {profilePhotoObjectUrl && !profilePhotoLoadError ? (
                    <img
                      src={profilePhotoObjectUrl}
                      alt={getDisplayName()}
                      className="w-24 h-24 rounded-full object-cover border-4 border-border-primary-light dark:border-border-primary-dark"
                      onError={() => setProfilePhotoLoadError(true)}
                    />
                  ) : (() => {
                    const profilePhotoUrl = logoUrls.profilePictureUrl ?? getPhotoUrl();
                    const useFallbackUrl =
                      profilePhotoUrl &&
                      !isFirebaseStorageUrl(profilePhotoUrl) &&
                      (profilePhotoApiFailed || !profilePhotoObjectUrl);
                    const useStorageUrlLastResort =
                      profilePhotoUrl &&
                      isFirebaseStorageUrl(profilePhotoUrl) &&
                      (profilePhotoApiFailed || profilePhotoLoadError);
                    if (useFallbackUrl) {
                      return (
                        <img
                          src={profilePhotoUrl!}
                          alt={getDisplayName()}
                          className="w-24 h-24 rounded-full object-cover border-4 border-border-primary-light dark:border-border-primary-dark"
                          onError={() => setProfilePhotoLoadError(true)}
                        />
                      );
                    }
                    if (useStorageUrlLastResort) {
                      return (
                        <img
                          src={profilePhotoUrl!}
                          alt={getDisplayName()}
                          className="w-24 h-24 rounded-full object-cover border-4 border-border-primary-light dark:border-border-primary-dark"
                          onError={() => setProfilePhotoLoadError(true)}
                        />
                      );
                    }
                    return (
                      <div className="w-24 h-24 rounded-full bg-marine-red text-white flex items-center justify-center font-bold text-3xl border-4 border-border-primary-light dark:border-border-primary-dark">
                        {getAvatarContent()}
                      </div>
                    );
                  })()}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      ref={profilePictureInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleProfilePictureChange}
                      disabled={pictureSaving}
                      aria-label="Change profile photo"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => profilePictureInputRef.current?.click()}
                      disabled={pictureSaving}
                    >
                      {pictureSaving ? 'Uploading...' : 'Change photo'}
                    </Button>
                    {(logoUrls.profilePictureUrl ?? getPhotoUrl()) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveProfilePicture}
                        disabled={pictureSaving}
                        className="text-marine-red hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                {/* User Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Display Name
                    </label>
                    <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                      {getDisplayName()}
                    </p>
                  </div>

                  {user.profile?.firstName && user.profile?.lastName && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Full Name
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.profile.firstName} {user.profile.lastName}
                      </p>
                    </div>
                  )}

                  {user.profile?.rank && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Rank
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.profile.rank}
                      </p>
                    </div>
                  )}

                  {user.email && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Email
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.email}
                      </p>
                      {user.emailVerified && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  )}

                  {user.profile?.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Phone Number
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.profile.phoneNumber}
                      </p>
                    </div>
                  )}

                  {user.profile?.role && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Role
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.profile.role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
            <Card.Footer>
              <Button
                variant="secondary"
                onClick={() => router.push('/settings')}
              >
                Edit Profile
              </Button>
            </Card.Footer>
          </Card>

          <EncryptionKeyManagement variant="summary" />

          {/* Logos */}
          <Card elevation="base" padding="lg">
            <Card.Header>
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Logos
              </h2>
              <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Upload company logo (optional); choose a battalion logo from East Coast options.
              </p>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Company logo
                  </p>
                  {logoUrls.companyLogoUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={logoUrls.companyLogoUrl}
                        alt="Company logo"
                        className="h-16 w-auto object-contain border border-border-primary-light dark:border-border-primary-dark rounded"
                      />
                      <div className="flex gap-2">
                        <input
                          ref={companyLogoInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => handleLogoUpload('company', e)}
                          aria-label="Change company logo"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => companyLogoInputRef.current?.click()}
                        >
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleOpenSharedLogos}
                        >
                          Choose from shared
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLogo('company')}
                          className="text-marine-red hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={companyLogoInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleLogoUpload('company', e)}
                        aria-label="Upload company logo"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => companyLogoInputRef.current?.click()}
                      >
                        Upload company logo
                      </Button>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm mx-2">or</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleOpenSharedLogos}
                      >
                        Choose from shared logos
                      </Button>
                    </>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Battalion logo
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3">
                    Choose a battalion logo (East Coast)
                  </p>
                  {logoUrls.battalionLogoUrl ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={logoUrls.battalionLogoUrl}
                          alt="Battalion logo"
                          className="h-16 w-auto object-contain border border-border-primary-light dark:border-border-primary-dark rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveLogo('battalion')}
                          className="text-marine-red hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          Remove
                        </Button>
                      </div>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        Or choose a different battalion:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {BATTALIONS.map((battalion) => {
                          const path = BATTALION_LOGO_PATHS[battalion];
                          const isSelected = logoUrls.battalionLogoUrl === path;
                          return (
                            <button
                              key={battalion}
                              type="button"
                              onClick={() => handleSelectBattalionLogo(battalion)}
                              className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark ${
                                isSelected
                                  ? 'border-marine-red bg-red-50 dark:bg-red-950/30'
                                  : 'border-border-primary-light dark:border-border-primary-dark hover:border-marine-red/50 dark:hover:border-marine-red/50'
                              }`}
                              aria-pressed={isSelected}
                              aria-label={`Select ${battalion} Battalion logo`}
                            >
                              <img
                                src={path}
                                alt={`${battalion} Battalion`}
                                className="h-10 w-10 object-contain"
                              />
                              <span className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                                {battalion}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {BATTALIONS.map((battalion) => {
                        const path = BATTALION_LOGO_PATHS[battalion];
                        return (
                          <button
                            key={battalion}
                            type="button"
                            onClick={() => handleSelectBattalionLogo(battalion)}
                            className="flex flex-col items-center gap-1 rounded-lg border-2 border-border-primary-light dark:border-border-primary-dark p-2 min-h-[44px] transition-colors hover:border-marine-red/50 dark:hover:border-marine-red/50 focus:outline-none focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark"
                            aria-label={`Select ${battalion} Battalion logo`}
                          >
                            <img
                              src={path}
                              alt={`${battalion} Battalion`}
                              className="h-10 w-10 object-contain"
                            />
                            <span className="text-xs font-medium text-text-primary-light dark:text-text-primary-dark">
                              {battalion}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Shared company logos modal */}
          {showSharedLogosModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="shared-logos-title"
            >
              <div className="bg-background-primary-light dark:bg-background-primary-dark rounded-xl shadow-xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col">
                <h3
                  id="shared-logos-title"
                  className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark mb-4"
                >
                  Choose from shared company logos
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  Logos shared by others in your company. Selecting one will set it as your company logo.
                </p>
                {sharedLogosLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent" />
                  </div>
                ) : sharedLogos.length === 0 ? (
                  <p className="text-text-secondary-light dark:text-text-secondary-dark py-6">
                    No shared logos for your company yet. Upload a company logo to share it with others.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto flex-1 min-h-0">
                    {sharedLogos.map((logo) => (
                      <button
                        key={logo.logoId}
                        type="button"
                        onClick={() => handleSelectSharedLogo(logo.logoUrl)}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-border-primary-light dark:border-border-primary-dark hover:border-marine-red focus:outline-none focus:ring-2 focus:ring-marine-red min-h-[44px]"
                      >
                        <img
                          src={logo.logoUrl}
                          alt={logo.metadata?.fileName ?? 'Company logo'}
                          className="h-14 w-auto object-contain max-w-full"
                        />
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate w-full text-center">
                          {logo.metadata?.fileName ?? 'Logo'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setShowSharedLogosModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy */}
          <Card elevation="base" padding="lg">
            <Card.Header>
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Privacy
              </h2>
              <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Control who can see your profile information
              </p>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <label className="flex items-center gap-3 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={privacy.showProfilePicture}
                    onChange={(e) => handlePrivacyChange('showProfilePicture', e.target.checked)}
                    disabled={privacySaving}
                    className="w-5 h-5 rounded border-border-primary-light dark:border-border-primary-dark"
                  />
                  <span className="text-text-primary-light dark:text-text-primary-dark">
                    Show profile picture to others in my organization
                  </span>
                </label>
                <label className="flex items-center gap-3 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={privacy.showContactToSameCompany}
                    onChange={(e) => handlePrivacyChange('showContactToSameCompany', e.target.checked)}
                    disabled={privacySaving}
                    className="w-5 h-5 rounded border-border-primary-light dark:border-border-primary-dark"
                  />
                  <span className="text-text-primary-light dark:text-text-primary-dark">
                    Show contact info to others in my company
                  </span>
                </label>
              </div>
            </Card.Body>
          </Card>

          {/* Share App */}
          <Card elevation="base" padding="lg">
            <Card.Body>
              <p className="text-text-primary-light dark:text-text-primary-dark mb-3">
                Share CountCard with other drill instructors.
              </p>
              <Button
                variant="secondary"
                onClick={() => router.push('/share')}
                className="min-h-[44px]"
              >
                Share with Other Drill Instructors
              </Button>
            </Card.Body>
          </Card>

          {/* Account Linking Card */}
          <Card elevation="base" padding="lg">
            <Card.Header>
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Linked Accounts
              </h2>
              <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Link multiple authentication providers to your account for easier access
              </p>
            </Card.Header>
            <Card.Body>
              <AccountLinking />
            </Card.Body>
          </Card>

          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard')}
            >
              Save
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
