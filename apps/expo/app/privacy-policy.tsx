import { UnderConstruction } from '@/components/ui/UnderConstruction';

export default function PrivacyPolicyScreen() {
  return (
    <UnderConstruction
      title="Privacy Policy"
      sprintRef="Sprint 2"
      showBackLink={false}
      needsAdded={[
        'Full privacy policy document.',
        'Version tracking and acceptance storage (Sprint 2 acceptance flow exists).',
      ]}
    />
  );
}
