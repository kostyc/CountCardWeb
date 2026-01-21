'use client';

/**
 * Profile Creation Page
 * Multi-step form for creating user profile with required and optional fields
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/config';
import { logError, logInfo } from '@/lib/utils/logger';
import { USMCRank, UserRole, OrganizationalAssignment, Regiment } from '@/types/auth';
import { uploadProfilePicture } from '@/lib/storage/profilePicture';
import { calculateProfileCompletion } from '@/lib/utils/profileCompletion';

/**
 * USMC Rank options
 */
const ENLISTED_RANKS: { value: USMCRank; label: string }[] = [
  { value: 'Sgt', label: 'Sergeant (Sgt)' },
  { value: 'SSgt', label: 'Staff Sergeant (SSgt)' },
  { value: 'GySgt', label: 'Gunnery Sergeant (GySgt)' },
  { value: 'MSgt', label: 'Master Sergeant (MSgt)' },
  { value: '1stSgt', label: 'First Sergeant (1stSgt)' },
  { value: 'MGySgt', label: 'Master Gunnery Sergeant (MGySgt)' },
  { value: 'SgtMaj', label: 'Sergeant Major (SgtMaj)' },
  { value: 'SgtMajMC', label: 'Sergeant Major of the Marine Corps (SgtMajMC)' },
];

const OFFICER_RANKS: { value: USMCRank; label: string }[] = [
  { value: '2ndLt', label: 'Second Lieutenant (2ndLt)' },
  { value: '1stLt', label: 'First Lieutenant (1stLt)' },
  { value: 'Capt', label: 'Captain (Capt)' },
  { value: 'Maj', label: 'Major (Maj)' },
  { value: 'LtCol', label: 'Lieutenant Colonel (LtCol)' },
  { value: 'Col', label: 'Colonel (Col)' },
];

/**
 * User Role options
 */
const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'drill_instructor', label: 'Drill Instructor' },
  { value: 'senior_drill_instructor', label: 'Senior Drill Instructor' },
  { value: 'chief_drill_instructor', label: 'Chief Drill Instructor' },
  { value: 'company_first_sgt', label: 'Company 1stSgt' },
  { value: 'series_commander', label: 'Series Commander' },
  { value: 'company_xo', label: 'Company XO' },
  { value: 'company_commander', label: 'Company Commander' },
  { value: 'battalion_sgt_maj', label: 'Battalion SgtMaj' },
  { value: 'battalion_xo', label: 'Battalion XO' },
  { value: 'battalion_commander', label: 'Battalion Commander' },
];

/**
 * Regiment options
 */
const REGIMENTS: { value: Regiment; label: string }[] = [
  { value: 'West', label: 'West' },
  { value: 'East', label: 'East' },
];

export default function CreateProfilePage(): JSX.Element {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // Step state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 3;

  // Form state - Step 1: Required Information
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [rank, setRank] = useState<USMCRank | ''>('');
  const [email, setEmail] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');

  // Form state - Step 2: Role and Organization
  const [role, setRole] = useState<UserRole | ''>('');
  const [regiment, setRegiment] = useState<Regiment | ''>('');
  const [battalion, setBattalion] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [series, setSeries] = useState<string>('');
  const [platoon, setPlatoon] = useState<string>('');

  // Form state - Step 3: Profile Picture (optional)
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);

  // UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  /**
   * Load saved progress from localStorage
   */
  useEffect(() => {
    if (!user) return;

    const savedProgress = localStorage.getItem(`profile-wizard-${user.uid}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setFirstName(progress.firstName || '');
        setLastName(progress.lastName || '');
        setRank(progress.rank || '');
        setEmail(progress.email || '');
        setPhoneNumber(progress.phoneNumber || '');
        setRole(progress.role || '');
        setRegiment(progress.regiment || '');
        setBattalion(progress.battalion || '');
        setCompany(progress.company || '');
        setSeries(progress.series || '');
        setPlatoon(progress.platoon || '');
        setCurrentStep(progress.currentStep || 1);
        logInfo('Loaded saved profile wizard progress', 'CreateProfilePage');
      } catch (error) {
        logError(error as Error, 'CreateProfilePage.loadProgress');
      }
    }
  }, [user]);

  /**
   * Save progress to localStorage
   */
  const saveProgress = (): void => {
    if (!user) return;

    const progress = {
      firstName,
      lastName,
      rank,
      email,
      phoneNumber,
      role,
      regiment,
      battalion,
      company,
      series,
      platoon,
      currentStep,
    };

    localStorage.setItem(`profile-wizard-${user.uid}`, JSON.stringify(progress));
  };

  /**
   * Calculate and update completion percentage
   */
  useEffect(() => {
    const profileData = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      rank: rank || undefined,
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
      role: role || undefined,
      organizationalAssignment: (regiment || battalion || company || series || platoon) ? {
        regiment: regiment || undefined,
        battalion: battalion || undefined,
        company: company || undefined,
        series: series || undefined,
        platoon: platoon || undefined,
      } : undefined,
      profilePictureUrl: profilePicturePreview || undefined,
    };

    const completion = calculateProfileCompletion(profileData);
    setCompletionPercentage(completion);
  }, [firstName, lastName, rank, email, phoneNumber, role, regiment, battalion, company, series, platoon, profilePicturePreview]);

  /**
   * Auto-save progress when form fields change
   */
  useEffect(() => {
    if (user && (firstName || lastName || rank || email || phoneNumber)) {
      saveProgress();
    }
  }, [firstName, lastName, rank, email, phoneNumber, role, regiment, battalion, company, series, platoon, currentStep, user]);

  /**
   * Validate Step 1 (Required Information)
   */
  const validateStep1 = (): boolean => {
    if (!firstName.trim()) {
      setFormError('First name is required');
      return false;
    }

    if (!lastName.trim()) {
      setFormError('Last name is required');
      return false;
    }

    if (!rank) {
      setFormError('Rank is required');
      return false;
    }

    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (!phoneNumber.trim()) {
      setFormError('Phone number is required');
      return false;
    }

    // Basic phone validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      setFormError('Please enter a valid 10-digit phone number');
      return false;
    }

    return true;
  };

  /**
   * Handle Step 1 submission
   */
  const handleStep1Submit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setFormError(null);

    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  /**
   * Handle Step 2 submission
   */
  const handleStep2Submit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setFormError(null);
    setCurrentStep(3);
  };

  /**
   * Handle profile picture selection
   */
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormError('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size must be less than 5MB');
        return;
      }

      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Upload profile picture to Firebase Storage
   */
  const handleProfilePictureUpload = async (userId: string): Promise<string | null> => {
    if (!profilePicture) {
      return null;
    }

    try {
      const url = await uploadProfilePicture(userId, profilePicture);
      if (url) {
        logInfo('Profile picture uploaded successfully', 'CreateProfilePage.uploadProfilePicture');
      }
      return url;
    } catch (error) {
      logError(error as Error, 'CreateProfilePage.uploadProfilePicture');
      return null;
    }
  };

  /**
   * Handle final form submission
   */
  const handleFinalSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError('You must be authenticated to create a profile');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get Firebase ID token
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('User not authenticated');
      }

      // Upload profile picture if provided
      let profilePictureUrl: string | null = null;
      if (profilePicture) {
        profilePictureUrl = await handleProfilePictureUpload(user.uid);
        if (!profilePictureUrl) {
          throw new Error('Failed to upload profile picture. Please try again.');
        }
      }

      // Build organizational assignment
      const organizationalAssignment: OrganizationalAssignment | undefined = 
        (regiment || battalion || company || series || platoon) ? {
          regiment: regiment || undefined,
          battalion: battalion || undefined,
          company: company || undefined,
          series: series || undefined,
          platoon: platoon || undefined,
        } : undefined;

      // Create profile
      const profileResponse = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          firstName,
          lastName,
          rank,
          email,
          phoneNumber,
          role: role || undefined,
          organizationalAssignment,
          profilePictureUrl,
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }

      // Set custom claims if role or organizational assignment provided
      if (role || organizationalAssignment) {
        const claimsResponse = await fetch('/api/user/set-custom-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            role: role || undefined,
            organizationalAssignment,
          }),
        });

        if (!claimsResponse.ok) {
          const errorData = await claimsResponse.json();
          logError(new Error(errorData.error || 'Failed to set custom claims'), 'CreateProfilePage');
          // Don't fail the entire operation if claims fail
        }
      }

      // Calculate and save completion percentage
      const profileData = {
        firstName,
        lastName,
        rank: rank as USMCRank,
        email,
        phoneNumber,
        role: role || undefined,
        organizationalAssignment,
        profilePictureUrl: profilePictureUrl || undefined,
      };
      
      const completion = calculateProfileCompletion(profileData);
      
      // Update completion status via API
      try {
        await fetch('/api/user/profile/completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            completionPercentage: completion,
          }),
        });
      } catch (completionError) {
        // Don't fail the entire operation if completion update fails
        logError(completionError as Error, 'CreateProfilePage.updateCompletion');
      }

      // Clear saved progress
      localStorage.removeItem(`profile-wizard-${user.uid}`);

      // Refresh user data
      await refreshUser();

      logInfo('Profile created successfully', 'CreateProfilePage');
      
      // Redirect to dashboard
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logError(err as Error, 'CreateProfilePage.handleFinalSubmit');
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Format phone number for display
   */
  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  /**
   * Handle phone number input
   */
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-heading-light dark:text-text-heading-dark mb-2">
            Create Your Profile
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Complete your profile to get started with CountCard
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Profile {completionPercentage}% Complete
            </span>
          </div>
          <div className="w-full bg-background-secondary-light dark:bg-background-secondary-dark rounded-full h-2">
            <div
              className="bg-marine-red h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Profile Creation Card */}
        <div className="bg-background-card-light dark:bg-background-card-dark rounded-lg shadow-lg p-8 border border-border-primary-light dark:border-border-primary-dark">
          {/* Error Message */}
          {formError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{formError}</p>
            </div>
          )}

          {/* Step 1: Required Information */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit}>
              <h2 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-6">
                Required Information
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="Smith"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rank" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Rank *
                  </label>
                  <select
                    id="rank"
                    value={rank}
                    onChange={(e) => setRank(e.target.value as USMCRank)}
                    required
                    className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                  >
                    <option value="">Select Rank</option>
                    <optgroup label="Enlisted Ranks">
                      {ENLISTED_RANKS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Officer Ranks">
                      {OFFICER_RANKS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Phone Number *
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    required
                    className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                    placeholder="(555) 123-4567"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
                >
                  Next: Role & Organization
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Role and Organization */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit}>
              <h2 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-6">
                Role & Organization (Optional)
              </h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                You can skip this step and complete it later if needed.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                  >
                    <option value="">Select Role (Optional)</option>
                    {USER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="regiment" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Regiment
                  </label>
                  <select
                    id="regiment"
                    value={regiment}
                    onChange={(e) => setRegiment(e.target.value as Regiment)}
                    className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                  >
                    <option value="">Select Regiment (Optional)</option>
                    {REGIMENTS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="battalion" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Battalion
                    </label>
                    <input
                      id="battalion"
                      type="text"
                      value={battalion}
                      onChange={(e) => setBattalion(e.target.value)}
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="1st, 2nd, 3rd, Support"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="Alpha, Bravo, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="series" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Series
                    </label>
                    <input
                      id="series"
                      type="text"
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="Lead Series, Follow Series"
                    />
                  </div>

                  <div>
                    <label htmlFor="platoon" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                      Platoon
                    </label>
                    <input
                      id="platoon"
                      type="text"
                      value={platoon}
                      onChange={(e) => setPlatoon(e.target.value)}
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="2001, 2002, etc."
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="bg-background-secondary-light dark:bg-background-secondary-dark hover:bg-background-tertiary-light dark:hover:bg-background-tertiary-dark text-text-primary-light dark:text-text-primary-dark font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
                >
                  Next: Profile Picture
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Profile Picture */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalSubmit}>
              <h2 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-6">
                Profile Picture (Optional)
              </h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                You can skip this step and add a profile picture later.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="profilePicture" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Profile Picture
                  </label>
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                  />
                  {profilePicturePreview && (
                    <div className="mt-4">
                      <img
                        src={profilePicturePreview}
                        alt="Profile preview"
                        className="w-32 h-32 rounded-full object-cover border-2 border-border-primary-light dark:border-border-primary-dark"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="bg-background-secondary-light dark:bg-background-secondary-dark hover:bg-background-tertiary-light dark:hover:bg-background-tertiary-dark text-text-primary-light dark:text-text-primary-dark font-medium py-2 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
                >
                  {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
