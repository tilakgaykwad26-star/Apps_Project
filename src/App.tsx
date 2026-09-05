import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MandalProvider } from './context/MandalContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { Footer } from './components/common/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { EventsPage } from './pages/EventsPage';
import { GalleryPage } from './pages/GalleryPage';
import { NoticesPage } from './pages/NoticesPage';
import { DonatePage } from './pages/DonatePage';
import { ContactPage } from './pages/ContactPage';
import { MemberPortalPage } from './pages/MemberPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const VALID_VIEWS = ['home', 'about', 'events', 'gallery', 'notices', 'donate', 'members', 'contact', 'admin'];

const getViewFromHash = (): string => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return VALID_VIEWS.includes(hash) ? hash : 'home';
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>(() => getViewFromHash());
  const { isSuperAdmin, isTreasurer, isCommitteeAdmin } = useAuth();

  // Listen to browser hash changes (Refresh, Back, Forward, Direct bookmark link)
  useEffect(() => {
    const handleHashChange = () => {
      const view = getViewFromHash();
      setCurrentView(view);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (window.location.hash !== `#/${view}`) {
      window.location.hash = `#/${view}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header currentView={currentView} onNavigate={handleNavigate} />

      <main className="main-content">
        <ErrorBoundary>
          {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}
          {currentView === 'about' && <AboutPage />}
          {currentView === 'events' && <EventsPage />}
          {currentView === 'gallery' && <GalleryPage />}
          {currentView === 'notices' && <NoticesPage />}
          {currentView === 'donate' && <DonatePage />}
          {currentView === 'members' && <MemberPortalPage />}
          {currentView === 'contact' && <ContactPage />}
          {currentView === 'admin' && (isSuperAdmin || isTreasurer || isCommitteeAdmin ? (
            <AdminDashboardPage />
          ) : (
            <HomePage onNavigate={handleNavigate} />
          ))}
        </ErrorBoundary>
      </main>

      <Footer onNavigate={handleNavigate} />
      <BottomNav currentView={currentView} onNavigate={handleNavigate} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <MandalProvider>
            <AppContent />
          </MandalProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
};

export default App;
