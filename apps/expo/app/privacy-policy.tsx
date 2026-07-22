import { LegalDocument } from '@/components/ui/LegalDocument';
import { PRIVACY_POLICY } from '@/constants/legalDocuments';

export default function PrivacyPolicyScreen() {
  return <LegalDocument document={PRIVACY_POLICY} />;
}
