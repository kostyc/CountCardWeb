export const LEGAL_DOCUMENT_VERSION = '2026-07-06';

export interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalDocumentContent {
  title: string;
  effectiveDate: string;
  version: string;
  intro: string;
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDocumentContent = {
  title: 'Privacy Policy',
  effectiveDate: 'July 6, 2026',
  version: LEGAL_DOCUMENT_VERSION,
  intro:
    'CountCard helps Marine Corps drill instructors and authorized staff track recruit accountability. This policy describes how Warrior Waypoint collects, uses, and protects information when you use CountCard.',
  sections: [
    {
      title: 'Information we collect',
      paragraphs: [
        'Account information such as your email address and authentication identifiers from Firebase Authentication.',
        'Profile and organizational assignment data you or an administrator enter (name, role, unit assignment).',
        'Recruit accountability data entered by authorized users, including assignments, fitness events, receiving intake records, count cards, and messages within your organization.',
        'Technical data required to operate the service (device type, app version, and security signals such as App Check tokens). We do not sell personal information.',
      ],
    },
    {
      title: 'How we use information',
      paragraphs: [
        'To authenticate you and enforce role-based access within your unit.',
        'To store and display recruit accountability records for authorized personnel.',
        'To provide encryption, export, and deletion features where enabled for your account.',
        'To maintain audit logs of administrative actions and improve reliability and security.',
      ],
    },
    {
      title: 'Encryption and sensitive data',
      paragraphs: [
        'Sensitive recruit profile fields may be encrypted client-side before storage. Encryption keys are managed per user; recovery codes are shown only to you during setup.',
        'We mask personally identifiable information in the user interface by default where the product supports masking.',
        'Do not share recovery codes, passwords, or authentication codes with unauthorized persons.',
      ],
    },
    {
      title: 'Your rights (GDPR-aligned)',
      paragraphs: [
        'You may request access to your data and export encrypted records where the product provides export tools.',
        'You may request deletion of your account data subject to organizational retention requirements and applicable law.',
        'You may contact your organization administrator or Warrior Waypoint for data-processing questions.',
      ],
    },
    {
      title: 'Retention and security',
      paragraphs: [
        'Data is stored in Google Firebase (Firestore, Authentication, Storage) under project countcard-94c5b. Access is restricted by security rules and custom claims.',
        'We apply industry-standard safeguards including encryption in transit (HTTPS/TLS) and role-scoped access controls.',
        'Retention follows organizational and regulatory requirements for military personnel records.',
      ],
    },
    {
      title: 'Contact',
      paragraphs: [
        'Questions about this policy: info@warriorwaypoint.com',
        'For official use only. Unauthorized access or disclosure of recruit information may violate regulations and applicable law.',
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDocumentContent = {
  title: 'Terms of Service',
  effectiveDate: 'July 6, 2026',
  version: LEGAL_DOCUMENT_VERSION,
  intro:
    'By creating an account or using CountCard, you agree to these Terms. If you do not agree, do not use the service.',
  sections: [
    {
      title: 'Authorized use',
      paragraphs: [
        'CountCard is for authorized Marine Corps drill instructor and staff accountability workflows only.',
        'You must use an official or organization-approved email address and keep credentials confidential.',
        'You may not access recruit or unit data outside your assigned role and organizational scope.',
      ],
    },
    {
      title: 'User responsibilities',
      paragraphs: [
        'You are responsible for the accuracy of data you enter and for complying with unit SOPs and applicable regulations.',
        'Do not upload classified information unless your organization has explicitly authorized CountCard for that classification level.',
        'Report suspected unauthorized access or data incidents to your chain of command and Warrior Waypoint promptly.',
      ],
    },
    {
      title: 'Service availability',
      paragraphs: [
        'CountCard is provided on an as-available basis. Maintenance, updates, or third-party outages may affect availability.',
        'We may modify features with reasonable notice where practicable. Critical security updates may apply without advance notice.',
      ],
    },
    {
      title: 'Intellectual property',
      paragraphs: [
        'CountCard software, branding, and documentation are owned by Warrior Waypoint or its licensors.',
        'You receive a limited, non-exclusive license to use the application for authorized organizational purposes.',
      ],
    },
    {
      title: 'Limitation of liability',
      paragraphs: [
        'To the maximum extent permitted by law, Warrior Waypoint is not liable for indirect, incidental, or consequential damages arising from use of CountCard.',
        'Operational decisions remain the responsibility of command; CountCard is a tool to support accountability, not a substitute for orders or regulations.',
      ],
    },
    {
      title: 'Changes and contact',
      paragraphs: [
        'We may update these Terms. Continued use after the effective date constitutes acceptance of the updated Terms.',
        'Questions: info@warriorwaypoint.com',
      ],
    },
  ],
};
