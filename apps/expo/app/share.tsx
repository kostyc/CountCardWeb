import { UnderConstruction } from '@/components/ui/UnderConstruction';

export default function ShareScreen() {
  return (
    <UnderConstruction
      title="Share App"
      sprintRef="Sprint 7"
      needsAdded={[
        'Share App UI and flow (UserMenu placeholder per Sprint 2).',
        'Define share target (link, email) and permissions.',
      ]}
    />
  );
}
