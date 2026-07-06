'use client';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/feedback';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import type { RecruitProfile } from '@/types/models';
import type { Company } from '@/lib/validation/organizationSchemas';
import { RankDisplay } from './RankDisplay';

export interface RecruitCompanyColumnViewProps {
  companies: Company[];
  recruitsByCompany: Record<string, RecruitProfile[]>;
  loading?: boolean;
  onRecruitClick: (recruitId: string) => void;
}

function statusClass(status: string | undefined): string {
  if (status === 'active') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
  if (status === 'graduated') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

export function RecruitCompanyColumnView({
  companies,
  recruitsByCompany,
  loading = false,
  onRecruitClick,
}: RecruitCompanyColumnViewProps): JSX.Element {
  return (
    <div className="overflow-x-auto pb-2 -mx-1 px-1">
      <div className="flex gap-4 min-w-max">
        {companies.map((company) => {
          const companyRecruits = recruitsByCompany[company] ?? [];

          return (
            <Card
              key={company}
              className="flex flex-col w-[min(100%,280px)] min-w-[280px] max-h-[70vh] p-0 overflow-hidden shrink-0"
            >
              <div className="px-4 py-3 border-b border-border-primary-light dark:border-border-primary-dark bg-background-secondary-light dark:bg-background-secondary-dark">
                <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                  {company}
                </h3>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {companyRecruits.length} recruit{companyRecruits.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border-primary-light dark:divide-border-primary-dark">
                {companyRecruits.length === 0 && !loading ? (
                  <p className="px-4 py-6 text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
                    No recruits
                  </p>
                ) : (
                  companyRecruits.map((recruit) => (
                    <button
                      key={recruit.id}
                      type="button"
                      onClick={() => onRecruitClick(recruit.id)}
                      className="w-full text-left px-4 py-3 min-h-[44px] hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark transition-colors"
                    >
                      <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        {recruit.lastName}, {recruit.firstName}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {recruit.rank ? <RankDisplay rank={recruit.rank} size="sm" /> : null}
                        {recruit.platoon ? <span>Plt {recruit.platoon}</span> : null}
                        <span
                          className={`inline-flex px-2 py-0.5 font-semibold rounded-full ${statusClass(recruit.status)}`}
                        >
                          {recruit.status || '—'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        EDIPI: {formatEdipiForDisplay(recruit)}
                      </div>
                    </button>
                  ))
                )}
                {loading && companyRecruits.length === 0 ? (
                  <div className="px-4 py-4">
                    <Skeleton lines={3} />
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
