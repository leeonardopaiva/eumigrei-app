'use client';

import React from 'react';
import Community from '@/views/Community';
import GroupsDirectory from '@/views/GroupsDirectory';
import Home from '@/views/Home';
import Profile from '@/views/Profile';
import SearchResults from '@/views/SearchResults';
import type { PersonaMode, ProfessionalProfileIdentity, User } from '@/types';
import { parseAppRoute } from '@/lib/app-route';

type UserWorkspaceProps = {
  currentUser: User;
  pathname: string;
  personaMode: PersonaMode;
  effectivePersonaMode: PersonaMode;
  professionalIdentity: ProfessionalProfileIdentity | null;
  canUseProfessionalMode: boolean;
  onPersonaModeChange: (mode: PersonaMode) => void;
};

const UserWorkspace: React.FC<UserWorkspaceProps> = ({
  currentUser,
  pathname,
  personaMode,
  effectivePersonaMode,
  professionalIdentity,
  canUseProfessionalMode,
  onPersonaModeChange,
}) => {
  const { segments, rootSegment } = parseAppRoute(pathname);

  if (segments.length === 0) {
    return <Home user={currentUser} />;
  }

  switch (rootSegment) {
    case 'community':
      return (
        <Community
          user={currentUser}
          personaMode={effectivePersonaMode}
          professionalIdentity={professionalIdentity}
        />
      );
    case 'buscar':
      return <SearchResults />;
    case 'profile':
      return (
        <Profile
          user={currentUser}
          personaMode={personaMode}
          canUseProfessionalMode={canUseProfessionalMode}
          onPersonaModeChange={onPersonaModeChange}
        />
      );
    case 'grupos':
      return <GroupsDirectory user={currentUser} />;
    default:
      return <Home user={currentUser} />;
  }
};

export default UserWorkspace;
