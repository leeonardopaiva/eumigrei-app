'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Layout from './components/Layout';
import Home from './views/Home';
import Community from './views/Community';
import Marketplace from './views/Marketplace';
import Profile from './views/Profile';
import BusinessList from './views/BusinessList';
import BusinessDetail from './views/BusinessDetail';
import HousingList from './views/HousingList';
import JobList from './views/JobList';
import NewsList from './views/NewsList';
import EventsList from './views/EventsList';
import Registration from './views/Registration';
import { UserRole, User } from './types';

const STORAGE_KEY = 'eumigrei.currentUser';

const App: React.FC = () => {
  const pathname = usePathname() || '/';
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser) as User);
      }
    } catch (error) {
      console.error('Error restoring user session:', error);
    } finally {
      setReady(true);
    }
  }, []);

  const login = (role: UserRole) => {
    const user: User = {
      id: '1',
      name: 'Fulano',
      role,
      avatar: 'https://picsum.photos/seed/user1/200',
      location: 'Boston, 02108',
    };

    setCurrentUser(user);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  };

  if (!ready) {
    return null;
  }

  if (!currentUser) {
    return <Registration onLogin={() => login(UserRole.CLIENT)} />;
  }

  const segments = pathname.split('/').filter(Boolean);
  const rootSegment = segments[0];

  const content = (() => {
    if (segments.length === 0) {
      return <Home user={currentUser} />;
    }

    if (rootSegment === 'negocios' && segments.length === 1) {
      return <BusinessList />;
    }

    if (rootSegment === 'negocios' && segments.length === 2) {
      return <BusinessDetail businessId={decodeURIComponent(segments[1])} />;
    }

    switch (rootSegment) {
      case 'community':
        return <Community user={currentUser} />;
      case 'marketplace':
        return <Marketplace />;
      case 'profile':
        return <Profile user={currentUser} />;
      case 'moradia':
        return <HousingList />;
      case 'vagas':
        return <JobList />;
      case 'noticias':
        return <NewsList />;
      case 'eventos':
        return <EventsList />;
      default:
        return <Home user={currentUser} />;
    }
  })();

  return <Layout user={currentUser}>{content}</Layout>;
};

export default App;
