import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Home, Calendar, HeartHandshake, Bell, User, ShieldCheck } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const { t } = useLanguage();
  const { isSuperAdmin, isTreasurer, isCommitteeAdmin } = useAuth();

  const items = [
    { key: 'home', label: t.nav.home, icon: Home },
    { key: 'events', label: t.nav.events, icon: Calendar },
    { key: 'donate', label: t.nav.donate, icon: HeartHandshake, highlight: true },
    { key: 'notices', label: t.nav.notices, icon: Bell },
    { key: 'members', label: t.nav.members, icon: User },
  ];

  if (isSuperAdmin || isTreasurer || isCommitteeAdmin) {
    items[4] = { key: 'admin', label: t.nav.admin, icon: ShieldCheck, highlight: false };
  }

  return (
    <nav className="bottom-nav-bar">
      {items.map((item) => {
        const isActive = currentView === item.key;
        const Icon = item.icon;

        if (item.highlight) {
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginTop: '-18px'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-saffron-500) 0%, var(--color-saffron-600) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(230, 81, 0, 0.35)',
                border: '3px solid var(--color-surface)'
              }}>
                <Icon size={22} />
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--color-saffron-600)',
                marginTop: '2px'
              }}>
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              height: '100%',
              background: 'none',
              border: 'none',
              color: isActive ? 'var(--color-maroon-700)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span style={{
              fontSize: '0.72rem',
              fontWeight: isActive ? 700 : 500
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
