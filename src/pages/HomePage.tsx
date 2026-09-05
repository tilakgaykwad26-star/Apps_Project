import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal, DEFAULT_HERO_SLIDES } from '../context/MandalContext';
import { LiveStreamCard } from '../components/common/LiveStreamCard';
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
  ChevronLeft,
  MapPin,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Radio,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useLivePresence } from '../services/livePresenceService';

interface HomePageProps {
  onNavigate: (view: string) => void;
  onOpenDonateModal?: (presetAmount?: number, type?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenDonateModal }) => {
  const { language, t, isMarathi } = useLanguage();
  const { events, notices, albums, committee, activeSponsors, heroSlides, festivalConfig, liveStreamConfig } = useMandal();

  const realActiveViewers = useLivePresence(Boolean(liveStreamConfig?.isLive));
  const baseOffset = liveStreamConfig?.baseViewers && liveStreamConfig.baseViewers > 1 ? (liveStreamConfig.baseViewers - 1) : 0;
  const totalLiveViewers = realActiveViewers + baseOffset;

  const upcomingEvents = events.filter((e) => e.status === 'upcoming').slice(0, 2);
  const urgentNotices = notices.filter((n) => n.isPublished && (n.priority === 'urgent' || n.priority === 'important')).slice(0, 3);
  const coreCommittee = committee.filter((c) => c.isCoreMember).slice(0, 4);

  // Hero Auto-Sliding Banner Carousel
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Dynamic Auto slide interval from Festival Settings (0 = Off/Disabled, Default 5s)
  const isAutoScrollDisabled = festivalConfig?.sliderIntervalSeconds === 0;
  const slideIntervalMs = (festivalConfig?.sliderIntervalSeconds && festivalConfig.sliderIntervalSeconds > 0)
    ? festivalConfig.sliderIntervalSeconds * 1000
    : 5000;

  useEffect(() => {
    if (isAutoScrollDisabled || !heroSlides || heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, slideIntervalMs);
    return () => clearInterval(timer);
  }, [isAutoScrollDisabled, heroSlides?.length, slideIntervalMs]);

  const prevSlide = () => {
    if (!heroSlides || heroSlides.length === 0) return;
    setCurrentSlideIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    if (!heroSlides || heroSlides.length === 0) return;
    setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const safeIndex = (currentSlideIndex >= 0 && currentSlideIndex < (heroSlides?.length || 0)) ? currentSlideIndex : 0;
  const currentSlide = (heroSlides && heroSlides[safeIndex]) ? heroSlides[safeIndex] : (heroSlides?.[0] || DEFAULT_HERO_SLIDES[0]);

  const handleActionClick = (actionKey: string) => {
    if (actionKey === 'annadaan' && onOpenDonateModal) {
      onOpenDonateModal(500, 'annadaan');
    } else {
      onNavigate(actionKey);
    }
  };

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
      {/* 1. Hero Auto-Sliding Festival Banner Carousel */}
      <section
        style={{
          background: currentSlide.bannerMode === 'full_photo' && currentSlide.imageUrl
            ? '#0D0202'
            : (currentSlide.imageUrl
              ? `linear-gradient(to right, rgba(15, 2, 2, 0.90) 0%, rgba(30, 4, 4, 0.78) 50%, rgba(15, 2, 2, 0.60) 100%), url("${currentSlide.imageUrl}") center center / cover no-repeat`
              : currentSlide.gradient),
          color: '#FFFFFF',
          padding: currentSlide.bannerMode === 'full_photo' && currentSlide.imageUrl ? '0' : 'var(--space-2xl) 0 calc(var(--space-2xl) + 16px) 0',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          transition: 'background 0.8s ease-in-out',
          minHeight: currentSlide.bannerMode === 'full_photo' && currentSlide.imageUrl ? '320px' : '440px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Previous Slide Arrow */}
        <button
          type="button"
          onClick={prevSlide}
          className="hero-nav-arrow hero-nav-prev"
          title="मागील स्लाईड (Previous Slide)"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Next Slide Arrow */}
        <button
          type="button"
          onClick={nextSlide}
          className="hero-nav-arrow hero-nav-next"
          title="पुढील स्लाईड (Next Slide)"
          aria-label="Next Slide"
        >
          <ChevronRight size={24} />
        </button>

        {/* Subtle decorative motif background (shown on standard mode) */}
        {currentSlide.bannerMode !== 'full_photo' && (
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
        )}

        {/* MODE A: PLAIN FULL PHOTO BANNER (केवळ पूर्ण फोटो बॅनर) */}
        {currentSlide.bannerMode === 'full_photo' && currentSlide.imageUrl ? (
          <div style={{ width: '100%', position: 'relative' }}>
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.titleMarathi || 'Durga Mandal Festival Banner'}
              style={{
                width: '100%',
                maxHeight: '560px',
                minHeight: '280px',
                objectFit: 'cover',
                display: 'block',
                cursor: 'default'
              }}
            />
            {/* Overlay Bottom Dots & Badge */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}>
              {heroSlides.map((slide, idx) => {
                const isActive = idx === currentSlideIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlideIndex(idx);
                    }}
                    style={{
                      width: isActive ? '32px' : '10px',
                      height: '10px',
                      borderRadius: '5px',
                      backgroundColor: isActive ? 'var(--color-gold-500)' : 'rgba(255, 255, 255, 0.45)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      padding: 0
                    }}
                    title={`स्लाईड ${idx + 1}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
              <span style={{ fontSize: '0.75rem', color: '#FFE0B2', marginLeft: '6px', fontWeight: 600 }}>
                {toMarathiDigits(currentSlideIndex + 1)} / {toMarathiDigits(heroSlides.length)}
              </span>
            </div>
          </div>
        ) : (
          /* MODE B: STANDARD TEXT + BACKGROUND BANNER */
          <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%' }}>
            <div key={currentSlide.id} className="hero-slide-enter" style={{ maxWidth: '820px' }}>

              {/* Prominent Live Broadcast Active Bar */}
              {liveStreamConfig?.isLive && (
                <div
                  onClick={() => {
                    const el = document.getElementById('live-stream-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95) 0%, rgba(153, 27, 27, 0.98) 100%)',
                    border: '2px solid rgba(254, 202, 202, 0.85)',
                    borderRadius: '30px',
                    padding: '8px 20px',
                    marginBottom: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(220, 38, 38, 0.7), 0 4px 14px rgba(0,0,0,0.4)',
                    animation: 'pulse 2s infinite',
                    color: '#FFFFFF',
                    flexWrap: 'wrap'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                    <Radio size={18} className="animate-pulse" color="#FFFFFF" />
                    🔴 थेट प्रक्षेपण चालू आहे (LIVE)
                  </span>
                  <span style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#A7F3D0' }}>
                    <span className="live-green-radar" style={{ width: '9px', height: '9px' }} />
                    <Users size={15} color="#34D399" />
                    <span><strong>{totalLiveViewers}</strong> भाविक थेट पाहत आहेत (Active Now)</span>
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#FDE68A', fontWeight: 800, textDecoration: 'underline', marginLeft: '4px' }}>
                    येथे क्लिक करून थेट पहा ▶
                  </span>
                </div>
              )}

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(212, 175, 55, 0.25)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--color-gold-500)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 14px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#FBF6DF',
                marginBottom: 'var(--space-md)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                <Sparkles size={16} color={currentSlide.accentColor} />
                <span>{currentSlide.badge}</span>
              </div>

              <h1 style={{
                color: '#FFFFFF',
                fontSize: 'clamp(2rem, 5vw, 3.2rem)',
                fontFamily: 'var(--font-serif)',
                lineHeight: 1.2,
                marginBottom: 'var(--space-sm)',
                textShadow: '0 2px 10px rgba(0,0,0,0.6)'
              }}>
                {isMarathi ? currentSlide.titleMarathi : currentSlide.titleEnglish}
              </h1>

              <div style={{
                fontSize: '1.15rem',
                color: '#FFE0B2',
                fontWeight: 600,
                marginBottom: 'var(--space-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textShadow: '0 1px 4px rgba(0,0,0,0.5)'
              }}>
                <Calendar size={20} color={currentSlide.accentColor} />
                <span>{isMarathi ? currentSlide.highlightMarathi : currentSlide.highlightEnglish}</span>
              </div>

              <p style={{
                fontSize: '1.02rem',
                color: '#FBF4EB',
                lineHeight: 1.6,
                marginBottom: 'var(--space-xl)',
                maxWidth: '680px',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)'
              }}>
                {isMarathi ? currentSlide.descMarathi : currentSlide.descEnglish}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                {liveStreamConfig?.isLive && (
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('live-stream-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn btn-danger btn-lg"
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      padding: '0.8rem 1.8rem',
                      gap: '8px',
                      boxShadow: '0 0 25px rgba(220, 38, 38, 0.7)',
                      backgroundColor: '#DC2626',
                      borderColor: '#EF4444',
                      color: '#FFFFFF'
                    }}
                  >
                    <Radio size={20} className="animate-pulse" />
                    <span>🔴 थेट आरती व दर्शन (🟢 {totalLiveViewers} ॲक्टिव्ह)</span>
                  </button>
                )}

                <button
                  onClick={() => handleActionClick(currentSlide.btn1ActionKey)}
                  className="btn btn-saffron btn-lg"
                  style={{ fontSize: '1.05rem', fontWeight: 700, padding: '0.8rem 1.8rem', gap: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}
                >
                  <HeartHandshake size={20} />
                  <span>{currentSlide.btn1TextMarathi}</span>
                </button>

                <button
                  onClick={() => handleActionClick(currentSlide.btn2ActionKey)}
                  className="btn btn-outline-gold btn-lg"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)', backdropFilter: 'blur(8px)', color: '#FFFFFF', borderColor: '#D4AF37', gap: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
                >
                  <Calendar size={20} />
                  <span>{currentSlide.btn2TextMarathi}</span>
                </button>
              </div>
            </div>

            {/* Pagination Indicators / Dots */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: 'var(--space-xl)',
              paddingTop: 'var(--space-sm)'
            }}>
              {heroSlides.map((slide, idx) => {
                const isActive = idx === currentSlideIndex;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(idx)}
                    style={{
                      width: isActive ? '32px' : '10px',
                      height: '10px',
                      borderRadius: '5px',
                      backgroundColor: isActive ? 'var(--color-gold-500)' : 'rgba(255, 255, 255, 0.35)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      padding: 0
                    }}
                    title={`स्लाईड ${idx + 1}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                );
              })}
              <span style={{ fontSize: '0.75rem', color: '#FFE0B2', marginLeft: '6px', fontWeight: 600 }}>
                {toMarathiDigits(currentSlideIndex + 1)} / {toMarathiDigits(heroSlides.length)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Live Stream Broadcast Section */}
      <div id="live-stream-section" className="container" style={{ marginTop: '24px' }}>
        <LiveStreamCard />
      </div>

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
