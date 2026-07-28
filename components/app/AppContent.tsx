'use client';

import React from 'react';
import AdminWorkspace from '@/components/app/workspaces/AdminWorkspace';
import BusinessWorkspace from '@/components/app/workspaces/BusinessWorkspace';
import UserWorkspace from '@/components/app/workspaces/UserWorkspace';
import type { PersonaMode, ProfessionalProfileIdentity, User } from '@/types';
import { parseAppRoute } from '@/lib/app-route';
import type { BusinessesInitialData, CommunityInitialData, EventsInitialData, HomeInitialData, ProfileInitialData } from '@/lib/content-contracts';

type AppContentProps = {
  currentUser: User;
  pathname: string;
  personaMode: PersonaMode;
  effectivePersonaMode: PersonaMode;
  professionalIdentity: ProfessionalProfileIdentity | null;
  canUseProfessionalMode: boolean;
  onPersonaModeChange: (mode: PersonaMode) => void;
  initialHomeData?: HomeInitialData;
  initialCommunityData?: CommunityInitialData;
  initialBusinessesData?: BusinessesInitialData;
  initialEventsData?: EventsInitialData;
  initialProfileData?: ProfileInitialData;
};

const AppContent: React.FC<AppContentProps> = ({
  currentUser,
  pathname,
  personaMode,
  effectivePersonaMode,
  professionalIdentity,
  canUseProfessionalMode,
  onPersonaModeChange,
  initialHomeData,
  initialCommunityData,
  initialBusinessesData,
  initialEventsData,
  initialProfileData,
}) => {
  const { rootSegment } = parseAppRoute(pathname);

  if (rootSegment === 'admin') {
    return <AdminWorkspace currentUser={currentUser} />;
  }

  if (rootSegment === 'negocios' || rootSegment === 'eventos' || rootSegment === 'marketplace') {
    return (
      <BusinessWorkspace
        currentUser={currentUser}
        pathname={pathname}
        effectivePersonaMode={effectivePersonaMode}
        professionalIdentity={professionalIdentity}
        initialBusinessesData={initialBusinessesData}
        initialEventsData={initialEventsData}
      />
    );
  }

  return (
    <UserWorkspace
      currentUser={currentUser}
      pathname={pathname}
      personaMode={personaMode}
      effectivePersonaMode={effectivePersonaMode}
      professionalIdentity={professionalIdentity}
      canUseProfessionalMode={canUseProfessionalMode}
      onPersonaModeChange={onPersonaModeChange}
      initialHomeData={initialHomeData}
      initialCommunityData={initialCommunityData}
      initialProfileData={initialProfileData}
    />
  );
};

export default AppContent;
