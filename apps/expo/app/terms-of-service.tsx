import { LegalDocument } from '@/components/ui/LegalDocument';
import { TERMS_OF_SERVICE } from '@/constants/legalDocuments';

export default function TermsOfServiceScreen() {
  return <LegalDocument document={TERMS_OF_SERVICE} />;
}
