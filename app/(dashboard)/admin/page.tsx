'use client';

/**
 * Admin Panel - Role Assignment
 * Allows admins to assign roles and organizational assignments to users
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHasPermission } from '@/hooks/useHasPermission';
import { auth } from '@/lib/firebase/config';
import { logError, logInfo } from '@/lib/utils/logger';
import { UserRole, OrganizationalAssignment, Regiment } from '@/types/auth';
import { canAssignRoles } from '@/lib/permissions/roles';

/**
 * User role options with labels
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

/**
 * User interface for display
 */
interface UserForDisplay {
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  rank?: string;
  role?: UserRole;
  organizationalAssignment?: OrganizationalAssignment;
}

export default function AdminPage(): JSX.Element {
  const { user } = useAuth();
  const canAssign = useHasPermission('assign_roles');

  const [users, setUsers] = useState<UserForDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserForDisplay | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [organizationalAssignment, setOrganizationalAssignment] = useState<OrganizationalAssignment>({
    regiment: undefined,
    battalion: '',
    company: '',
    series: '',
    platoon: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Load users
   */
  useEffect(() => {
    loadUsers();
  }, [searchQuery]);

  /**
   * Load users from API
   */
  const loadUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const url = searchQuery
        ? `/api/admin/users?search=${encodeURIComponent(searchQuery)}`
        : '/api/admin/users';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      logError(err as Error, 'AdminPage.loadUsers');
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user selection
   */
  const handleUserSelect = (selected: UserForDisplay): void => {
    setSelectedUser(selected);
    setSelectedRole(selected.role || '');
    setOrganizationalAssignment(selected.organizationalAssignment || {
      regiment: undefined,
      battalion: '',
      company: '',
      series: '',
      platoon: '',
    });
    setError(null);
    setSuccess(null);
  };

  /**
   * Handle role assignment submission
   */
  const handleSubmit = async (): Promise<void> => {
    if (!selectedUser) {
      setError('Please select a user');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Build organizational assignment (only include non-empty fields)
      const orgAssignment: OrganizationalAssignment | undefined = 
        (organizationalAssignment.regiment || 
         organizationalAssignment.battalion || 
         organizationalAssignment.company || 
         organizationalAssignment.series || 
         organizationalAssignment.platoon) ? {
          regiment: organizationalAssignment.regiment || undefined,
          battalion: organizationalAssignment.battalion || undefined,
          company: organizationalAssignment.company || undefined,
          series: organizationalAssignment.series || undefined,
          platoon: organizationalAssignment.platoon || undefined,
        } : undefined;

      const response = await fetch('/api/user/set-custom-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId: selectedUser.userId,
          role: selectedRole,
          organizationalAssignment: orgAssignment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign role');
      }

      logInfo(`Role assigned to user ${selectedUser.userId}`, 'AdminPage');
      setSuccess('Role and organizational assignment updated successfully');
      
      // Reload users to show updated data
      await loadUsers();
      
      // Clear selection after a delay
      setTimeout(() => {
        setSelectedUser(null);
        setSelectedRole('');
        setOrganizationalAssignment({
          regiment: undefined,
          battalion: '',
          company: '',
          series: '',
          platoon: '',
        });
      }, 2000);
    } catch (err) {
      logError(err as Error, 'AdminPage.handleSubmit');
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user can assign roles
  if (!canAssign) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-4">
            Access Denied
          </h1>
          <p className="text-text-primary-light dark:text-text-primary-dark">
            You don't have permission to assign roles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-heading-light dark:text-text-heading-dark mb-2">
          Admin Panel - Role Assignment
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Assign roles and organizational assignments to users
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User List */}
        <div className="bg-background-card-light dark:bg-background-card-dark rounded-lg shadow-lg p-6 border border-border-primary-light dark:border-border-primary-dark">
          <h2 className="text-xl font-bold text-text-heading-light dark:text-text-heading-dark mb-4">
            Users
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent"></div>
              <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-8">
              No users found
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => handleUserSelect(u)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedUser?.userId === u.userId
                      ? 'bg-marine-red/10 border-marine-red dark:bg-marine-red/20'
                      : 'bg-background-secondary-light dark:bg-background-secondary-dark border-border-primary-light dark:border-border-primary-dark hover:bg-background-tertiary-light dark:hover:bg-background-tertiary-dark'
                  }`}
                >
                  <div className="font-medium text-text-heading-light dark:text-text-heading-dark">
                    {u.displayName || `${u.firstName} ${u.lastName}` || u.email || 'Unknown User'}
                  </div>
                  {u.email && (
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {u.email}
                    </div>
                  )}
                  {u.role && (
                    <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      Role: {u.role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Role Assignment Form */}
        <div className="bg-background-card-light dark:bg-background-card-dark rounded-lg shadow-lg p-6 border border-border-primary-light dark:border-border-primary-dark">
          <h2 className="text-xl font-bold text-text-heading-light dark:text-text-heading-dark mb-4">
            Assign Role & Organization
          </h2>

          {!selectedUser ? (
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-center py-8">
              Select a user to assign role and organizational assignment
            </p>
          ) : (
            <div className="space-y-4">
              {/* Selected User Info */}
              <div className="p-3 bg-background-secondary-light dark:bg-background-secondary-dark rounded-md">
                <div className="font-medium text-text-heading-light dark:text-text-heading-dark">
                  {selectedUser.displayName || `${selectedUser.firstName} ${selectedUser.lastName}` || selectedUser.email}
                </div>
                {selectedUser.email && (
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {selectedUser.email}
                  </div>
                )}
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Role *
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                >
                  <option value="">Select Role</option>
                  {USER_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Organizational Assignment */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Organizational Assignment (Optional)
                </label>

                <div>
                  <label htmlFor="regiment" className="block text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    Regiment
                  </label>
                  <select
                    id="regiment"
                    value={organizationalAssignment.regiment || ''}
                    onChange={(e) => setOrganizationalAssignment({
                      ...organizationalAssignment,
                      regiment: e.target.value as Regiment | undefined,
                    })}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="battalion" className="block text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Battalion
                    </label>
                    <input
                      id="battalion"
                      type="text"
                      value={organizationalAssignment.battalion || ''}
                      onChange={(e) => setOrganizationalAssignment({
                        ...organizationalAssignment,
                        battalion: e.target.value,
                      })}
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="1st, 2nd, 3rd, Support"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      value={organizationalAssignment.company || ''}
                      onChange={(e) => setOrganizationalAssignment({
                        ...organizationalAssignment,
                        company: e.target.value,
                      })}
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="Alpha, Bravo, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="series" className="block text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Series
                    </label>
                    <input
                      id="series"
                      type="text"
                      value={organizationalAssignment.series || ''}
                      onChange={(e) => setOrganizationalAssignment({
                        ...organizationalAssignment,
                        series: e.target.value,
                      })}
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="Lead Series, Follow Series"
                    />
                  </div>

                  <div>
                    <label htmlFor="platoon" className="block text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Platoon
                    </label>
                    <input
                      id="platoon"
                      type="text"
                      value={organizationalAssignment.platoon || ''}
                      onChange={(e) => setOrganizationalAssignment({
                        ...organizationalAssignment,
                        platoon: e.target.value,
                      })}
                      className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent"
                      placeholder="2001, 2002, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedRole}
                className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
              >
                {isSubmitting ? 'Assigning...' : 'Assign Role & Organization'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
