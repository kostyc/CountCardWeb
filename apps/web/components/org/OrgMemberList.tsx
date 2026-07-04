'use client';

/**
 * Members (staff) list for an organizational unit.
 * Fetches from GET /api/org/members with filter, search, and CSV export.
 */

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import Link from 'next/link';

export interface OrgMemberListParams {
  regimentId?: string;
  battalionId?: string;
  companyId?: string;
  seriesId?: string;
  platoonId?: string;
}

interface MemberItem {
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  role?: string;
}

function escapeCsv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function OrgMemberList(params: OrgMemberListParams): JSX.Element {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const hasParam = params.regimentId ?? params.battalionId ?? params.companyId ?? params.seriesId ?? params.platoonId;
  const queryParam = params.regimentId
    ? `regimentId=${encodeURIComponent(params.regimentId)}`
    : params.battalionId
      ? `battalionId=${encodeURIComponent(params.battalionId)}`
      : params.companyId
        ? `companyId=${encodeURIComponent(params.companyId)}`
        : params.seriesId
          ? `seriesId=${encodeURIComponent(params.seriesId)}`
          : params.platoonId
            ? `platoonId=${encodeURIComponent(params.platoonId)}`
            : '';

  const fetchMembers = useCallback(async (): Promise<void> => {
    if (!queryParam) return;
    setLoading(true);
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const url = `/api/org/members?${queryParam}&limit=200${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load members');
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [queryParam, search]);

  useEffect(() => {
    if (!hasParam) return;
    fetchMembers();
  }, [hasParam, fetchMembers]);

  const handleExportCsv = async (): Promise<void> => {
    if (!queryParam || items.length === 0) return;
    setExporting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');
      const url = `/api/org/members?${queryParam}&limit=1000${search ? `&search=${encodeURIComponent(search)}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Export failed');
      const list = (data.items ?? []) as MemberItem[];
      const rows = [
        ['Name', 'Email', 'Role'],
        ...list.map((u) => [
          ((u.displayName ?? [u.firstName, u.lastName].filter(Boolean).join(' ')) || u.userId).trim(),
          (u.email ?? ''),
          (u.role ?? ''),
        ]),
      ];
      const csv = rows.map((row) => row.map((c) => escapeCsv(String(c))).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (!hasParam) return <></>;

  return (
    <section className="mt-8 pt-6 border-t border-border-primary-light dark:border-border-primary-dark" aria-labelledby="members-heading">
      <h2 id="members-heading" className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark mb-3">
        Members (staff)
      </h2>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
        Users assigned to this organizational unit. Assignments are managed in User Management.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="min-h-[44px] flex-1 px-4 py-2 border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg bg-background-primary-light dark:bg-background-primary-dark text-text-primary-light dark:text-text-primary-dark"
          aria-label="Search members"
        />
        <button
          type="button"
          onClick={() => fetchMembers()}
          className="min-h-[44px] px-4 py-2 rounded-lg border-2 border-border-primary-light dark:border-border-primary-dark font-medium"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={loading || exporting || items.length === 0}
          className="min-h-[44px] px-4 py-2 rounded-lg bg-marine-red text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {error && (
        <p className="text-error-light dark:text-error-dark mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-marine-red border-r-transparent" />
          Loading…
        </div>
      ) : items.length === 0 ? (
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          No staff assigned to this unit.
        </p>
      ) : (
        <ul className="list-none p-0 space-y-2">
          {items.map((u) => (
            <li
              key={u.userId}
              className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-background-secondary-light dark:bg-background-secondary-dark border border-border-secondary-light dark:border-border-secondary-dark"
            >
              <Link
                href={`/dashboard/admin/users?userId=${encodeURIComponent(u.userId)}`}
                className="font-medium text-marine-red hover:underline min-h-[44px] inline-flex items-center"
              >
                {u.displayName ?? ([u.firstName, u.lastName].filter(Boolean).join(' ') || u.userId)}
              </Link>
              {u.email && (
                <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                  {u.email}
                </span>
              )}
              {u.role && (
                <span className="text-xs px-2 py-0.5 rounded bg-background-tertiary-light dark:bg-background-tertiary-dark">
                  {u.role}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
        <Link href="/dashboard/admin/users" className="text-marine-red hover:underline">
          Manage user assignments
        </Link>
      </p>
    </section>
  );
}
