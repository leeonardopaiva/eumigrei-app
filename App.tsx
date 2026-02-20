
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Community from './pages/Community';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import BusinessList from './pages/BusinessList';
import BusinessDetail from './pages/BusinessDetail';
import HousingList from './pages/HousingList';
import JobList from './pages/JobList';
import NewsList from './pages/NewsList';
import EventsList from './pages/EventsList';
import Registration from './pages/Registration';
import { UserRole, User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Mock initial login
  const login = (role: UserRole) => {
    setCurrentUser({
      id: '1',
      name: 'Fulano',
      role: role,
      avatar: 'https://picsum.photos/seed/user1/200',
      location: 'Boston, 02108'
    });
  };

  if (!currentUser) {
    return <Registration onLogin={() => login(UserRole.CLIENT)} />;
  }

  return (
    <HashRouter>
      <Layout user={currentUser}>
        <Routes>
          <Route path="/" element={<Home user={currentUser} />} />
          <Route path="/community" element={<Community user={currentUser} />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/profile" element={<Profile user={currentUser} />} />
          
          <Route path="/negocios" element={<BusinessList />} />
          <Route path="/negocios/:id" element={<BusinessDetail />} />
          <Route path="/moradia" element={<HousingList />} />
          <Route path="/vagas" element={<JobList />} />
          <Route path="/noticias" element={<NewsList />} />
          <Route path="/eventos" element={<EventsList />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
