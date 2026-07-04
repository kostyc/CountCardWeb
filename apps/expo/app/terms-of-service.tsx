import { UnderConstruction } from '@/components/ui/UnderConstruction';

export default function TermsOfServiceScreen() {
  return (
    <UnderConstruction
      title="Terms of Service"
      sprintRef="Sprint 2"
      showBackLink={false}
      needsAdded={[
        'Full terms of service document.',
        'Version tracking and acceptance storage (Sprint 2 acceptance flow exists).',
      ]}
    />
  );
}
