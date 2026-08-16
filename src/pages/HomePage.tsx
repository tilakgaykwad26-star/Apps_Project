import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { MANDAL_CONFIG } from '../config/constants';
import { formatMarathiDate, formatIndianDate, toMarathiDigits } from '../utils/dateUtils';
import { formatINR } from '../utils/currencyUtils';
import { handleImageError } from '../utils/imageUtils';
import {
  Sparkles,
  Calendar,
  HeartHandshake,
  Image,
  Bell,
  UserCheck,
  PhoneCall,
  Info,
  ChevronRight,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: string) => void;
  onOpenDonateModal?: (presetAmount?: number, type?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenDonateModal }) => {
  const { language, t, isMarathi } = useLanguage();
  const { events, notices, albums, committee, activeSponsors } = useMandal();

  const upcomingEvents = events.filter((e) => e.status === 'upcoming').slice(0, 2);
  const urgentNotices = notices.filter((n) => n.isPublished && (n.priority === 'urgent' || n.priority === 'important')).slice(0, 3);
  const coreCommittee = committee.filter((c) => c.isCoreMember).slice(0, 4);

  const quickActionsList = [
    { key: 'about', label: t.quickActions.about, icon: Info, color: '#871C1C' },
    { key: 'events', label: t.quickActions.events, icon: Calendar, color: '#E65100' },
    { key: 'donate', label: t.quickActions.donate, icon: HeartHandshake, color: '#D4AF37', highlight: true },
    { key: 'gallery', label: t.quickActions.gallery, icon: Image, color: '#871C1C' },
    { key: 'notices', label: t.quickActions.notices, icon: Bell, color: '#E65100' },
    { key: 'members', label: t.quickActions.members, icon: UserCheck, color: '#2E7D32' },
    { key: 'contact', label: t.quickActions.contact, icon: PhoneCall, color: '#0277BD' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      {/* 1. Hero Festival Banner */}
      <section style={{
        background: 'radial-gradient(circle at top right, #6F1616 0%, #871C1C 45%, #4A0808 100%)',
        color: '#FFFFFF',
        padding: 'var(--space-2xl) 0',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Subtle decorative motif background */}
        <div style={{
          position: 'absolute',
          right: '-5%',
          top: '-10%',
          opacity: 0.08,
          pointerEvents: 'none'
        }}>
          <svg width="450" height="450" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="4" fill="none" />
            <path d="M50 10 L50 90 M10 50 L90 50 M22 22 L78 78 M22 78 L78 22" stroke="#D4AF37" strokeWidth="2" />
          </svg>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(212, 175, 55, 0.22)',
              border: '1px solid var(--color-gold-500)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 14px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#FBF6DF',
              marginBottom: 'var(--space-md)'
            }}>
              <Sparkles size={16} color="#D4AF37" />
              <span>{MANDAL_CONFIG.currentFestival.greeting}</span>
            </div>

            <h1 style={{
              color: '#FFFFFF',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontFamily: 'var(--font-serif)',
              lineHeight: 1.2,
              marginBottom: 'var(--space-sm)',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              {MANDAL_CONFIG.currentFestival.titleMarathi}
            </h1>

            <div style={{
              fontSize: '1.15rem',
              color: '#FFE0B2',
              fontWeight: 600,
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Calendar size={20} color="#FF9800" />
              <span>{MANDAL_CONFIG.currentFestival.datesMarathi}</span>
            </div>

            <p style={{
              fontSize: '1rem',
              color: '#F0E6D8',
              lineHeight: 1.6,
              marginBottom: 'var(--space-xl)',
              maxWidth: '650px'
            }}>
              {language === 'en'
                ? 'A celebration of devotion, a pride in our culture, and a new path of service — let’s come together and celebrate Navratri'
                : '*भक्तीचा उत्सव, संस्कृतीचा अभिमान आणि सेवाभावाची नवी दिशा — चला, नवरात्रोत्सव एकत्र साजरा करूया!*'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <button
                onClick={() => onNavigate('donate')}
                className="btn btn-saffron btn-lg"
                style={{ fontSize: '1.05rem', fontWeight: 700, padding: '0.8rem 1.8rem' }}
              >
                <HeartHandshake size={20} />
                <span>{t.home.donateNowBtn}</span>
              </button>

              <button
                onClick={() => onNavigate('events')}
                className="btn btn-outline-gold btn-lg"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#FFFFFF', borderColor: '#D4AF37' }}
              >
                <Calendar size={20} />
                <span>{t.home.viewAllEvents}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Notice Ticker / Urgent Notices */}
      {urgentNotices.length > 0 && (
        <section className="container" style={{ marginTop: '-20px' }}>
          <div style={{
            backgroundColor: '#FFF8E1',
            border: '1.5px solid #FFE082',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-md) var(--space-lg)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-md)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
              <div style={{
                backgroundColor: 'var(--color-danger)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}>
                <Bell size={14} />
                <span>{t.notices.priorityUrgent}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-maroon-900)' }}>
                {isMarathi ? urgentNotices[0].titleMarathi || urgentNotices[0].title : urgentNotices[0].title}
              </div>
            </div>

            <button
              onClick={() => onNavigate('notices')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-maroon-700)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>{t.home.viewAllNotices}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      )}

      {/* 3. Quick Action Grid */}
      <section className="container">
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--color-maroon-800)' }}>
            {t.quickActions.title}
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          {quickActionsList.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.key}
                onClick={() => onNavigate(action.key)}
                className="card card-interactive"
                style={{
                  padding: 'var(--space-md) var(--space-sm)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: action.highlight ? '3px solid var(--color-saffron-500)' : '3px solid var(--color-maroon-700)'
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: action.highlight ? 'var(--color-saffron-50)' : 'var(--color-maroon-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: action.highlight ? 'var(--color-saffron-600)' : 'var(--color-maroon-700)'
                }}>
                  <Icon size={22} />
                </div>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: 'var(--color-text-primary)'
                }}>
                  {action.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Upcoming Featured Events */}
      <section className="container">
        <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--color-maroon-800)' }}>
              {t.home.upcomingHighlight}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('events')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-maroon-700)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{t.home.viewAllEvents}</span>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid-2">
          {upcomingEvents.map((evt) => (
            <div
              key={evt.id}
              className="card card-interactive"
              onClick={() => onNavigate('events')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: 0
              }}
            >
              <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
                <img
                  src={evt.coverImageUrl}
                  alt={evt.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                  onError={(e) => handleImageError(e, false)}
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: 'rgba(135, 28, 28, 0.92)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)'
                }}>
                  {formatMarathiDate(evt.startDate)}
                </div>
              </div>

              <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-maroon-800)', marginBottom: '6px' }}>
                  {isMarathi ? evt.titleMarathi || evt.title : evt.title}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: 'var(--space-md)',
                  flex: 1
                }}>
                  {isMarathi ? evt.descriptionMarathi || evt.description : evt.description}
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-muted)',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 'var(--space-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#E65100" />
                    <span>{evt.timeString}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#871C1C" />
                    <span>{isMarathi ? evt.venueMarathi || evt.venue : evt.venue}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Online Donation CTA Banner */}
      <section className="container">
        <div style={{
          background: 'linear-gradient(135deg, #FAF7F2 0%, #FFF3E0 100%)',
          border: '2px solid var(--color-gold-500)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          boxShadow: 'var(--shadow-md)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-xl)',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-saffron-600)',
              fontWeight: 700,
              fontSize: '0.85rem',
              marginBottom: '6px'
            }}>
              <HeartHandshake size={18} />
              <span>१००% सुरक्षित ऑनलाइन देणगी व सेवा</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
              {t.home.donationCtaTitle}
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
              {t.home.donationCtaSubtitle}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} color="#2E7D32" /> त्वरित PDF पावती
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} color="#2E7D32" /> UPI / Cards / NetBanking
              </span>
            </div>
          </div>

          {/* Quick preset donation buttons */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-maroon-800)', marginBottom: '12px' }}>
              त्वरित देणगी रक्कम निवडा:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
              {[501, 1101, 2101, 5101].map((amt) => (
                <button
                  key={amt}
                  onClick={() => onNavigate('donate')}
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--color-gold-500)',
                    backgroundColor: 'var(--color-gold-50)',
                    color: 'var(--color-maroon-800)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  ₹ {amt}
                </button>
              ))}
            </div>
            <button
              onClick={() => onNavigate('donate')}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              <span>{t.home.donateNowBtn}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Gallery Preview Section */}
      <section className="container">
        <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--color-maroon-800)' }}>
              {t.home.galleryPreviewTitle}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('gallery')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-maroon-700)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{t.home.viewFullGallery}</span>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid-3">
          {albums.slice(0, 3).map((alb) => (
            <div
              key={alb.id}
              className="card card-interactive"
              onClick={() => onNavigate('gallery')}
              style={{ padding: 0, overflow: 'hidden' }}
            >
              <div style={{ height: '190px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={alb.coverImageUrl}
                  alt={alb.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                  padding: '16px 12px 10px 12px',
                  color: '#fff'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {isMarathi ? alb.titleMarathi || alb.title : alb.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#FFD54F' }}>
                    {toMarathiDigits(alb.year)} | {toMarathiDigits(alb.imageCount)} {t.gallery.photosCount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Active Sponsors Showcase */}
      {activeSponsors.length > 0 && (
        <section className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
              {t.home.sponsorsTitle}
            </h2>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-lg)'
          }}>
            {activeSponsors.map((sp) => (
              <div
                key={sp.id}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: 'var(--shadow-xs)',
                  minWidth: '220px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  backgroundColor: '#f5f5f5'
                }}>
                  <img src={sp.logoUrl} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
                    {isMarathi ? sp.nameMarathi || sp.name : sp.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {sp.businessType}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Core Committee Directory Preview */}
      <section className="container">
        <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--color-maroon-800)' }}>
              {t.home.coreCommitteeTitle}
            </h2>
          </div>
          <button
            onClick={() => onNavigate('about')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-maroon-700)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{t.nav.about}</span>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid-4">
          {coreCommittee.map((m) => (
            <div
              key={m.id}
              className="card"
              style={{
                textAlign: 'center',
                padding: 'var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: '10px',
                border: '2px solid var(--color-gold-500)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <img
                  src={m.photoUrl}
                  alt={m.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-maroon-800)', marginBottom: '2px' }}>
                {isMarathi ? m.nameMarathi : m.name}
              </div>
              <div style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-saffron-600)',
                marginBottom: '10px'
              }}>
                {isMarathi ? m.designationMarathi : m.designationEnglish}
              </div>
              <a
                href={`tel:${m.phone.replace(/\s/g, '')}`}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', fontSize: '0.78rem', gap: '4px' }}
              >
                <PhoneCall size={13} color="var(--color-maroon-700)" />
                <span>{m.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
