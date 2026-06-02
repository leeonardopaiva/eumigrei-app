'use client';

import React from 'react';
import BusinessDetail from '@/views/BusinessDetail';
import BusinessList from '@/views/BusinessList';
import EventDetail from '@/views/EventDetail';
import Marketplace from '@/views/Marketplace';
import type { PersonaMode, ProfessionalProfileIdentity, User } from '@/types';
import { parseAppRoute } from '@/lib/app-route';

type BusinessWorkspaceProps = {
  currentUser: User;
  pathname: string;
  effectivePersonaMode: PersonaMode;
  professionalIdentity: ProfessionalProfileIdentity | null;
};

const BusinessWorkspace: React.FC<BusinessWorkspaceProps> = ({
  currentUser,
  pathname,
  effectivePersonaMode,
  professionalIdentity,
}) => {
  const { segments, rootSegment } = parseAppRoute(pathname);

  if (rootSegment === 'negocios' && segments.length === 1) {
    return <BusinessList personaMode={effectivePersonaMode} professionalIdentity={professionalIdentity} />;
  }

  if (rootSegment === 'negocios' && segments.length === 2) {
    return <BusinessDetail businessId={decodeURIComponent(segments[1])} user={currentUser} />;
  }

  if ((rootSegment === 'eventos' || rootSegment === 'marketplace') && segments.length === 2) {
    return <EventDetail eventId={decodeURIComponent(segments[1])} user={currentUser} />;
  }

  return <Marketplace personaMode={effectivePersonaMode} professionalIdentity={professionalIdentity} />;
};

export default BusinessWorkspace;
