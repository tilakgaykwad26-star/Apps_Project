import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useMandal } from '../../context/MandalContext';
import { MANDAL_CONFIG } from '../../config/constants';
import {
  Globe,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Sparkles,
  HeartHandshake,
  Calendar,
  Image,
  Bell,
  Home,
  Info,
  PhoneCall,
  Menu,
  X,
  Radio,
  Users
} from 'lucide-react';
import { useLivePresence } from '../../services/livePresenceService';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, isAuthenticated, isTreasurer, isSuperAdmin, isCommitteeAdmin } = useAuth();
  const { liveStreamConfig } = useMandal();

  const realActiveViewers = useLivePresence(Boolean(liveStreamConfig?.isLive));
  const baseOffset = liveStreamConfig?.baseViewers && liveStreamConfig.baseViewers > 1 ? (liveStreamConfig.baseViewers - 1) : 0;
  const totalLiveViewers = realActiveViewers + baseOffset;

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const navItems = [
    { key: 'home', label: t.nav.home, icon: Home },
    { key: 'about', label: t.nav.about, icon: Info },
    { key: 'events', label: t.nav.events, icon: Calendar },
    { key: 'gallery', label: t.nav.gallery, icon: Image },
    { key: 'notices', label: t.nav.notices, icon: Bell },
    { key: 'donate', label: t.nav.donate, icon: HeartHandshake, highlight: true },
    { key: 'members', label: t.nav.members, icon: User },
    { key: 'contact', label: t.nav.contact, icon: PhoneCall },
  ];

  if (liveStreamConfig?.isLive) {
    navItems.unshift({
      key: 'home',
      label: `🔴 LIVE (${totalLiveViewers})`,
      icon: Radio,
      highlight: true
    });
  }

  if (isSuperAdmin || isTreasurer || isCommitteeAdmin) {
    navItems.push({ key: 'admin', label: t.nav.admin, icon: ShieldCheck, highlight: false });
  }

  const handleLinkClick = (key: string) => {
    onNavigate(key);
    setIsMobileDrawerOpen(false);
  };

  return (
    <header className="app-header">
      {/* 1. Top Festive Bar */}
      <div className="header-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Sparkles size={14} color="#D4AF37" style={{ flexShrink: 0 }} />
          <span>{t.greeting} | {t.festivalBanner}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Language Selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FAF7F2',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              <Globe size={13} />
              <span>{language === 'mr' ? 'मराठी' : language === 'hi' ? 'हिंदी' : 'EN'}</span>
              <ChevronDown size={11} />
            </button>

            {isLangDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: '4px',
                minWidth: '110px',
                zIndex: 1500
              }}>
                <button
                  onClick={() => { setLanguage('mr'); setIsLangDropdownOpen(false); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    background: language === 'mr' ? 'var(--color-maroon-50)' : 'transparent',
                    color: language === 'mr' ? 'var(--color-maroon-700)' : 'var(--color-text-primary)',
                    fontWeight: language === 'mr' ? 700 : 400,
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer'
                  }}
                >
                  मराठी
                </button>
                <button
                  onClick={() => { setLanguage('hi'); setIsLangDropdownOpen(false); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    background: language === 'hi' ? 'var(--color-maroon-50)' : 'transparent',
                    color: language === 'hi' ? 'var(--color-maroon-700)' : 'var(--color-text-primary)',
                    fontWeight: language === 'hi' ? 700 : 400,
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer'
                  }}
                >
                  हिंदी
                </button>
                <button
                  onClick={() => { setLanguage('en'); setIsLangDropdownOpen(false); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    background: language === 'en' ? 'var(--color-maroon-50)' : 'transparent',
                    color: language === 'en' ? 'var(--color-maroon-700)' : 'var(--color-text-primary)',
                    fontWeight: language === 'en' ? 700 : 400,
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer'
                  }}
                >
                  English
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="container header-main-bar">
        {/* Brand Logo & Title */}
        <div
          onClick={() => onNavigate('home')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-maroon-700)',
            border: '2px solid var(--color-gold-500)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0
          }}>
            <svg viewBox="0 0 100 100" style={{ width: '38px', height: '38px' }}>
              <circle cx="50" cy="50" r="46" fill="#871C1C" />
              <path d="M50 18 L50 78 M42 26 C42 42 50 48 50 48 C50 48 58 42 58 26 M50 18 L46 25 L54 25 Z" stroke="#D4AF37" strokeWidth="4" fill="#D4AF37" strokeLinecap="round" />
              <path d="M50 12 Q54 16 50 20 Q46 16 50 12 Z" fill="#FF9800" />
              <rect x="36" y="76" width="28" height="6" rx="2" fill="#D4AF37" />
            </svg>
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--color-maroon-800)',
              lineHeight: 1.15
            }}>
              {language === 'en' ? MANDAL_CONFIG.nameEnglish : MANDAL_CONFIG.nameMarathi}
            </div>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--color-saffron-600)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}>
              {language === 'en' ? MANDAL_CONFIG.taglineEnglish : MANDAL_CONFIG.taglineMarathi}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav-links">
          {navItems.map((item) => {
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                style={{
                  background: item.highlight
                    ? 'linear-gradient(135deg, var(--color-saffron-500) 0%, var(--color-saffron-600) 100%)'
                    : isActive
                      ? 'var(--color-maroon-50)'
                      : 'transparent',
                  color: item.highlight
                    ? '#ffffff'
                    : isActive
                      ? 'var(--color-maroon-700)'
                      : 'var(--color-text-primary)',
                  fontWeight: isActive || item.highlight ? 700 : 500,
                  fontSize: '0.88rem',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: item.highlight
                    ? 'none'
                    : isActive
                      ? '1px solid var(--color-maroon-100)'
                      : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: item.highlight ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <item.icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions & Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-maroon-700)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.82rem',
                  fontWeight: 700
                }}>
                  {user?.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.displayName}
                </span>
                <ChevronDown size={13} />
              </button>

              {isUserMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xl)',
                  minWidth: '210px',
                  padding: '6px',
                  zIndex: 1500
                }}>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{user?.displayName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user?.phone ? `+91 ${user.phone}` : ''}</div>
                  </div>

                  {(isSuperAdmin || isTreasurer || isCommitteeAdmin) && (
                    <button
                      onClick={() => { onNavigate('admin'); setIsUserMenuOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 10px',
                        fontSize: '0.85rem',
                        background: 'var(--color-maroon-50)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--color-maroon-800)',
                        fontWeight: 700,
                        marginTop: '4px'
                      }}
                    >
                      <ShieldCheck size={16} color="var(--color-maroon-700)" />
                      <span>प्रशासक पॅनेल (Admin Panel)</span>
                    </button>
                  )}

                  <button
                    onClick={() => { onNavigate('members'); setIsUserMenuOpen(false); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: 'var(--radius-xs)',
                      color: 'var(--color-text-primary)'
                    }}
                  >
                    <User size={16} />
                    <span>{t.nav.myProfile}</span>
                  </button>

                  <button
                    onClick={() => { logout(); setIsUserMenuOpen(false); }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--color-danger)',
                      borderRadius: 'var(--radius-xs)'
                    }}
                  >
                    <LogOut size={16} />
                    <span>{t.nav.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {isMobileDrawerOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setIsMobileDrawerOpen(false)} />
          <div className="mobile-drawer-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, color: 'var(--color-maroon-800)', fontSize: '1.1rem' }}>
                मेनू (Menu)
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 4 }}
                aria-label="Close Menu"
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {navItems.map((item) => {
                const isActive = currentView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleLinkClick(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: item.highlight
                        ? 'linear-gradient(135deg, var(--color-saffron-500) 0%, var(--color-saffron-600) 100%)'
                        : isActive
                          ? 'var(--color-maroon-50)'
                          : 'transparent',
                      color: item.highlight
                        ? '#ffffff'
                        : isActive
                          ? 'var(--color-maroon-700)'
                          : 'var(--color-text-primary)',
                      fontWeight: isActive || item.highlight ? 700 : 500,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {isAuthenticated && (
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {user && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-maroon-800)', fontWeight: 600 }}>
                    {user.displayName}
                  </div>
                )}
                <button
                  onClick={() => { logout(); setIsMobileDrawerOpen(false); }}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--color-danger)', width: '100%', justifyContent: 'flex-start' }}
                >
                  <LogOut size={16} />
                  <span>{t.nav.logout}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};
