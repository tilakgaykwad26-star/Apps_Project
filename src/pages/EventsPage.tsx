import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { MandalEvent } from '../types/event';
import { formatMarathiDate, formatIndianDate, toMarathiDigits } from '../utils/dateUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Search,
  UserCheck,
  Share2
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { useNotification } from '../context/NotificationContext';
import { isValidIndianPhone } from '../utils/validationUtils';
import { formatEventNotificationMessage } from '../services/smsService';

export const EventsPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { events, recordRsvp, festivalConfig } = useMandal();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventForRsvp, setSelectedEventForRsvp] = useState<MandalEvent | null>(null);

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpGuests, setRsvpGuests] = useState('1');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  const filteredEvents = events.filter((e) => {
    const isStatusMatch = activeTab === 'upcoming' ? e.status === 'upcoming' || e.status === 'ongoing' : e.status === 'completed';
    const textMatch = (e.title + (e.titleMarathi || '') + e.venue + (e.venueMarathi || '')).toLowerCase().includes(searchTerm.toLowerCase());
    return isStatusMatch && textMatch;
  });

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) {
      showError('कृपया आपले पूर्ण नाव प्रविष्ट करा.');
      return;
    }
    if (!isValidIndianPhone(rsvpPhone)) {
      showError('कृपया वैध १० अंकी मोबाईल नंबर टाका.');
      return;
    }

    if (!selectedEventForRsvp) return;

    setIsSubmittingRsvp(true);
    try {
      await recordRsvp({
        eventId: selectedEventForRsvp.id,
        name: rsvpName.trim(),
        phone: rsvpPhone.trim(),
        guestCount: parseInt(rsvpGuests, 10) || 1
      });
      showSuccess(t.events.rsvpSuccess);
      setSelectedEventForRsvp(null);
      setRsvpName('');
      setRsvpPhone('');
      setRsvpGuests('1');
    } catch (err) {
      showError(t.common.errorOccurred);
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', paddingTop: 'var(--space-lg)' }}>
      {/* 1. Page Header */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.1rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
          {t.events.title}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {language === 'en'
            ? 'Explore our festive celebrations, religious ceremonies, and community gatherings.'
            : 'शारदीय नवरात्रोत्सव, महाआरती, भजन संध्या, अन्नदान व सामाजिक उपक्रमांचे संपूर्ण वेळापत्रक'}
        </p>
      </div>

      {/* 2. Tabs and Search Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        borderBottom: '2px solid var(--color-border)',
        paddingBottom: 'var(--space-sm)'
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'upcoming' ? 'var(--color-maroon-700)' : 'transparent',
              color: activeTab === 'upcoming' ? '#ffffff' : 'var(--color-text-primary)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={16} />
            <span>{t.events.upcomingTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('past')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'past' ? 'var(--color-maroon-700)' : 'transparent',
              color: activeTab === 'past' ? '#ffffff' : 'var(--color-text-primary)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle size={16} />
            <span>{t.events.pastTab}</span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t.common.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', minHeight: '38px', fontSize: '0.88rem' }}
          />
        </div>
      </div>

      {/* 3. Events List */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={activeTab === 'upcoming' ? t.events.noUpcoming : t.events.noPast}
          description="कृपया नवीन कार्यक्रमांच्या अद्यतनांसाठी सूचना फलक तपासा."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--space-lg)',
                padding: 0,
                overflow: 'hidden'
              }}
            >
              {/* Event Cover Image */}
              <div style={{ position: 'relative', height: '100%', minHeight: '220px' }}>
                <img
                  src={evt.coverImageUrl}
                  alt={evt.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  backgroundColor: 'rgba(135, 28, 28, 0.94)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {formatMarathiDate(evt.startDate)}
                </div>
              </div>

              {/* Event Content & Details */}
              <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
                    {isMarathi ? evt.titleMarathi || evt.title : evt.title}
                  </h2>
                  <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
                    {isMarathi ? evt.descriptionMarathi || evt.description : evt.description}
                  </p>

                  {/* Highlights */}
                  {evt.highlights && evt.highlights.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
                        कार्यक्रमाची प्रमुख वैशिष्ट्ये:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {evt.highlights.map((h, i) => (
                          <span key={i} className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata: Time, Venue, Chief Guest */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#E65100" />
                      <span><strong>{t.events.timeLabel}:</strong> {evt.timeString}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={16} color="#871C1C" />
                      <span><strong>{t.events.venueLabel}:</strong> {isMarathi ? evt.venueMarathi || evt.venue : evt.venue}</span>
                    </div>
                    {evt.chiefGuest && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} color="#2E7D32" />
                        <span><strong>प्रमुख उपस्थिती:</strong> {evt.chiefGuest}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RSVP and Action Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 'var(--space-md)',
                  flexWrap: 'wrap'
                }}>
                  {evt.isRsvpEnabled && evt.status === 'upcoming' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={() => setSelectedEventForRsvp(evt)}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '6px' }}
                      >
                        <UserCheck size={16} />
                        <span>{t.events.rsvpBtn}</span>
                      </button>
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        <strong>{toMarathiDigits(evt.rsvpCount)}</strong> {t.events.rsvpCountLabel}
                      </span>
                    </div>
                  ) : (
                    <span className="badge badge-maroon" style={{ fontSize: '0.8rem' }}>
                      {evt.status === 'completed' ? 'सोहळा संपन्न' : 'प्रवेश सर्वांसाठी खुला'}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        formatEventNotificationMessage({
                          mandalName: festivalConfig?.titleMarathi || 'सार्वजनिक बाल दुर्गा उत्सव मंडळ',
                          title: isMarathi ? evt.titleMarathi || evt.title : evt.title,
                          dateStr: formatMarathiDate(evt.startDate),
                          timeStr: evt.timeString,
                          venue: isMarathi ? evt.venueMarathi || evt.venue : evt.venue,
                          chiefGuest: evt.chiefGuest
                        })
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{
                        backgroundColor: '#25D366',
                        color: '#ffffff',
                        borderColor: '#25D366',
                        fontSize: '0.8rem',
                        gap: '5px',
                        fontWeight: 600
                      }}
                      title="कार्यक्रमाची माहिती WhatsApp वर पाठवा"
                    >
                      <Share2 size={14} />
                      <span>WhatsApp वर पाठवा</span>
                    </a>

                    {evt.venueMapUrl && (
                      <a
                        href={evt.venueMapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem' }}
                      >
                        <ExternalLink size={14} />
                        <span>{t.common.directions}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. RSVP Modal Dialog */}
      <Modal
        isOpen={!!selectedEventForRsvp}
        onClose={() => setSelectedEventForRsvp(null)}
        title={t.events.rsvpModalTitle}
      >
        {selectedEventForRsvp && (
          <form onSubmit={handleRsvpSubmit}>
            <div style={{ marginBottom: 'var(--space-md)', padding: '10px 14px', backgroundColor: 'var(--color-maroon-50)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-maroon-800)' }}>
                {isMarathi ? selectedEventForRsvp.titleMarathi || selectedEventForRsvp.title : selectedEventForRsvp.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {formatMarathiDate(selectedEventForRsvp.startDate)} | {selectedEventForRsvp.timeString}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">{t.events.namePlaceholder}</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="उदा. श्री. विकास जोशी"
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">{t.events.phonePlaceholder}</label>
              <input
                type="tel"
                required
                maxLength={10}
                className="form-input"
                placeholder="१० अंकी मोबाईल नंबर (उदा. 9822012345)"
                value={rsvpPhone}
                onChange={(e) => setRsvpPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.events.guestsPlaceholder}</label>
              <select
                className="form-select"
                value={rsvpGuests}
                onChange={(e) => setRsvpGuests(e.target.value)}
              >
                <option value="1">१ व्यक्ती (फक्त मी)</option>
                <option value="2">२ व्यक्ती</option>
                <option value="3">३ व्यक्ती</option>
                <option value="4">४ व्यक्ती</option>
                <option value="5">५+ व्यक्ती (कुटुंब)</option>
              </select>
            </div>

            <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedEventForRsvp(null)}
                className="btn btn-secondary"
              >
                {t.admin.actions.cancel}
              </button>
              <button
                type="submit"
                disabled={isSubmittingRsvp}
                className="btn btn-primary"
              >
                {isSubmittingRsvp ? t.common.loading : 'नोंदणी निश्चित करा (Confirm RSVP)'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
