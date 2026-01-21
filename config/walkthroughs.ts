/**
 * Walkthrough Configurations
 * Step-by-step guide configurations for user onboarding
 */

import type { WalkthroughStep } from '@/components/walkthrough/Walkthrough';
import type { WalkthroughType } from '@/hooks/useWalkthrough';

/**
 * Onboarding walkthrough - Welcome and application overview
 */
export const onboardingWalkthrough: WalkthroughStep[] = [
  {
    id: 'welcome',
    target: 'body',
    title: 'Welcome to CountCard',
    content: 'Welcome to CountCard, the Marine Corps Drill Instructor accountability application. This walkthrough will help you get started with the key features.',
    position: 'center',
  },
  {
    id: 'navigation',
    target: '[data-walkthrough="navigation"]',
    title: 'Navigation',
    content: 'Use the navigation menu to access different sections of the application. You can navigate between Recruits, Count Cards, Incident Alerts, and your Profile.',
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'user-menu',
    target: '[data-walkthrough="user-menu"]',
    title: 'User Menu',
    content: 'Click your profile picture or name to access your user menu. Here you can view your profile, adjust settings, and manage your account.',
    position: 'bottom',
    waitForElement: true,
  },
];

/**
 * Recruits walkthrough - Creating and managing recruits
 */
export const recruitsWalkthrough: WalkthroughStep[] = [
  {
    id: 'recruits-overview',
    target: '[data-walkthrough="recruits-page"]',
    title: 'Recruit Management',
    content: 'This is the Recruits page where you can view and manage all recruit profiles in your assigned platoon or organization.',
    position: 'center',
    waitForElement: true,
  },
  {
    id: 'create-recruit',
    target: '[data-walkthrough="create-recruit-button"]',
    title: 'Create New Recruit',
    content: 'Click this button to create a new recruit profile. You\'ll need to enter the recruit\'s name, rank, and organizational assignment.',
    position: 'bottom',
    waitForElement: true,
  },
  {
    id: 'recruit-list',
    target: '[data-walkthrough="recruit-list"]',
    title: 'Recruit List',
    content: 'View all recruits assigned to your platoon. You can search, filter, and sort recruits by various criteria.',
    position: 'top',
    waitForElement: true,
  },
];

/**
 * Count Cards walkthrough - Creating and submitting count cards
 */
export const countCardsWalkthrough: WalkthroughStep[] = [
  {
    id: 'count-cards-overview',
    target: '[data-walkthrough="count-cards-page"]',
    title: 'Count Cards',
    content: 'Count Cards are accountability records that track recruit status and location. Create count cards to document accountability at specific times.',
    position: 'center',
    waitForElement: true,
  },
  {
    id: 'create-count-card',
    target: '[data-walkthrough="create-count-card-button"]',
    title: 'Create Count Card',
    content: 'Click here to create a new count card. You\'ll select recruits, record their status, and submit through the approval workflow.',
    position: 'bottom',
    waitForElement: true,
  },
  {
    id: 'count-card-workflow',
    target: '[data-walkthrough="count-card-workflow"]',
    title: 'Approval Workflow',
    content: 'Count cards follow an approval workflow: Draft → Submitted → Under Review → Approved/Rejected. Track the status of your count cards here.',
    position: 'top',
    waitForElement: true,
  },
];

/**
 * Incident Alerts walkthrough - Mass incident alert system
 */
export const incidentAlertsWalkthrough: WalkthroughStep[] = [
  {
    id: 'incident-alerts-overview',
    target: '[data-walkthrough="incident-alerts-page"]',
    title: 'Incident Alert System',
    content: 'The Incident Alert system allows you to quickly notify the chain of command about critical incidents. Alerts are escalated through the proper channels.',
    position: 'center',
    waitForElement: true,
  },
  {
    id: 'create-alert',
    target: '[data-walkthrough="create-alert-button"]',
    title: 'Create Incident Alert',
    content: 'Click here to create a new incident alert. You\'ll specify the incident type, severity, location, and description.',
    position: 'bottom',
    waitForElement: true,
  },
  {
    id: 'alert-workflow',
    target: '[data-walkthrough="alert-workflow"]',
    title: 'Chain of Command Workflow',
    content: 'Alerts automatically escalate through the chain of command. Each level can acknowledge, respond, or escalate further. Messages are threaded for clear communication.',
    position: 'top',
    waitForElement: true,
  },
];

/**
 * Profile walkthrough - Profile management
 */
export const profileWalkthrough: WalkthroughStep[] = [
  {
    id: 'profile-overview',
    target: '[data-walkthrough="profile-page"]',
    title: 'Your Profile',
    content: 'Manage your profile information, including your rank, organizational assignment, role, and contact information.',
    position: 'center',
    waitForElement: true,
  },
  {
    id: 'profile-picture',
    target: '[data-walkthrough="profile-picture"]',
    title: 'Profile Picture',
    content: 'Upload or update your profile picture. This will be displayed throughout the application.',
    position: 'right',
    waitForElement: true,
  },
  {
    id: 'organizational-assignment',
    target: '[data-walkthrough="organizational-assignment"]',
    title: 'Organizational Assignment',
    content: 'Update your organizational assignment (Regiment, Battalion, Company, Series, Platoon) and role as needed.',
    position: 'top',
    waitForElement: true,
  },
];

/**
 * Get walkthrough steps by type
 */
export const getWalkthroughSteps = (type: WalkthroughType): WalkthroughStep[] => {
  switch (type) {
    case 'onboarding':
      return onboardingWalkthrough;
    case 'recruits':
      return recruitsWalkthrough;
    case 'countCards':
      return countCardsWalkthrough;
    case 'incidentAlerts':
      return incidentAlertsWalkthrough;
    case 'profile':
      return profileWalkthrough;
    default:
      return [];
  }
};
