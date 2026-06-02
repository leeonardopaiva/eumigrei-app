'use client';

import React from 'react';
import AdminWorkspace from '@/components/app/workspaces/AdminWorkspace';
import BusinessWorkspace from '@/components/app/workspaces/BusinessWorkspace';
import UserWorkspace from '@/components/app/workspaces/UserWorkspace';
import type { PersonaMode, ProfessionalProfileIdentity, User } from '@/types';
import { parseAppRoute } from '@/lib/app-route';

type AppContentProps = {
  currentUser: User;
  pathname: string;
  personaMode: PersonaMode;
  effectivePersonaMode: PersonaMode;
  professionalIdentity: ProfessionalProfileIdentity | null;
  canUseProfessionalMode: boolean;
  onPersonaModeChange: (mode: PersonaMode) => void;
};

const AppContent: React.FC<AppContentProps> = ({
  currentUser,
  pathname,
  personaMode,
  effectivePersonaMode,
  professionalIdentity,
  canUseProfessionalMode,
  onPersonaModeChange,
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
    />
  );
};

export default AppContent;
