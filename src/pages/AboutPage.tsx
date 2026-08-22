import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { MANDAL_CONFIG } from '../config/constants';
import { toMarathiDigits } from '../utils/dateUtils';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Building,
  CreditCard,
  Copy,
  Check,
  MapPin,
  PhoneCall,
  Mail,
  ExternalLink,
  Users,
  UserCheck,
  ChevronRight,
  Search,
  User
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { Modal } from '../components/common/Modal';

export const AboutPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { committee, members } = useMandal();
  const { showSuccess } = useNotification();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Member Directory Modal state
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'annual' | 'life' | 'patron'>('all');

  const filteredMembers = members.filter((m) => {
    const searchLower = memberSearch.toLowerCase().trim();
    const nameMatch =
      (m.fullNameMarathi || '').toLowerCase().includes(searchLower) ||
      (m.fullName || '').toLowerCase().includes(searchLower) ||
      (m.phone || '').includes(searchLower) ||
      (m.cityVillage || '').toLowerCase().includes(searchLower) ||
      (m.memberNumber || '').toLowerCase().includes(searchLower);

    const categoryMatch = categoryFilter === 'all' || m.category === categoryFilter;

    return nameMatch && categoryMatch;
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showSuccess(`${label} कॉपी करण्यात आला आहे!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', paddingTop: 'var(--space-lg)' }}>
      {/* 1. Page Header */}
      <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--color-maroon-50)',
          color: 'var(--color-maroon-700)',
          border: '1px solid var(--color-maroon-100)',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.82rem',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          <ShieldCheck size={16} />
          <span>अधिकृत नोंदणीकृत सार्वजनिक न्यास (Public Trust)</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-maroon-800)', marginBottom: '10px' }}>
          {language === 'en' ? MANDAL_CONFIG.nameEnglish : MANDAL_CONFIG.nameMarathi}
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)' }}>
          {language === 'en' ? MANDAL_CONFIG.taglineEnglish : MANDAL_CONFIG.taglineMarathi} — स्थापना वर्ष {toMarathiDigits(MANDAL_CONFIG.establishedYear)}
        </p>
      </div>

      {/* 2. Key Trust Badges */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 'var(--space-md)'
      }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '4px solid var(--color-maroon-700)', padding: '12px 14px' }}>
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-maroon-50)', color: 'var(--color-maroon-700)', flexShrink: 0 }}>
            <Award size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.about.regNumber}</div>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-maroon-800)', whiteSpace: 'nowrap', lineHeight: 1.3, marginTop: '2px', letterSpacing: '-0.3px' }}>
              {MANDAL_CONFIG.registrationNumber}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '4px solid var(--color-saffron-500)', padding: '12px 14px' }}>
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-saffron-50)', color: 'var(--color-saffron-600)', flexShrink: 0 }}>
            <Building size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.about.established}</div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
              इ.स. {toMarathiDigits(MANDAL_CONFIG.establishedYear)} (४० वर्षे पूर्ण)
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '4px solid var(--color-gold-500)', padding: '12px 14px' }}>
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--color-gold-50)', color: 'var(--color-gold-700)', flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>सक्रिय सभासद व स्वयंसेवक</div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
              ५००+ कुटुंबे जोडलेली
            </div>
          </div>
        </div>

        {/* 4. NEW CARD: Member List Button / Tile */}
        <div
          className="card"
          onClick={() => setIsMemberListOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderLeft: '4px solid #16a34a',
            backgroundColor: '#f0fdf4',
            cursor: 'pointer',
            padding: '12px 14px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.12)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(22, 163, 74, 0.22)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.12)';
          }}
        >
          <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#15803d', flexShrink: 0 }}>
            <UserCheck size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>मंडळ सभासद सूची</div>
            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#14532d', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              सभासद यादी पहा ({members.length}) <ChevronRight size={15} style={{ flexShrink: 0 }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mandal History & Overview */}
      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        <div className="card card-maroon-accent">
          <h2 style={{ fontSize: '1.35rem', marginBottom: '14px', color: 'var(--color-maroon-800)' }}>
            {t.about.overviewTitle}
          </h2>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
            {isMarathi
              ? 'सन १९८२ मध्ये सार्वजनिक बाल दुर्गा उत्सव मंडळाची स्थापना झाली. स्थापनेपासून आजपर्यंत मंडळाच्या माध्यमातून दरवर्षी दुर्गामातेचा उत्सव मोठ्या भक्तिभावाने, उत्साहाने आणि सामाजिक बांधिलकी जपत साजरा केला जात आहे.'
              : 'Sarvajanik Bal Durga Utsav Mandal was established in the year 1982. Since its inception, the Mandal has been celebrating the festival of Goddess Durga every year with immense devotion, enthusiasm, and a strong sense of social commitment'}
          </p>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: '10px' }}>
            {isMarathi
              ? 'काळानुसार मंडळाच्या कार्याला व्यापक स्वरूप प्राप्त झाले. मंडळाची प्रगती होत असताना मंडळाच्या नावात बदल करून “सार्वजनिक दुर्गा मंडळ” असे नामकरण करण्यात आले. नव्या पिढीचा उत्स्फूर्त सहभाग, पदाधिकारी व सदस्यांचे सहकार्य आणि नागरिकांचा विश्वास यामुळे मंडळाची वाटचाल दिवसेंदिवस अधिक भक्कम होत आहे.'
              : 'Over time, the Mandal s activities expanded significantly. Reflecting this growth and broader vision it was renamed Sarvajanik Durga Mandal. With the active participation of the younger generation, the cooperation of office bearers and members and the unwavering trust of local citizens the Mandal s journey has grown stronger by the day'}
          </p>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: '10px' }}>
            {isMarathi
              ? 'केवळ धार्मिक उत्सवापुरते मंडळाचे कार्य मर्यादित न ठेवता सामाजिक, शैक्षणिक आणि सांस्कृतिक हिताला प्राधान्य देण्यात येत आहे. मंडळाच्या माध्यमातून वेळोवेळी रक्तदान शिबिर, स्वच्छता अभियान तसेच विविध समाजोपयोगी उपक्रम राबविले जातात.'
              : 'Rather than limiting its efforts solely to religious celebrations, the Mandal prioritizes social, educational, and cultural initiatives. It regularly organizes community welfare programs such as blood donation camps and cleanliness drives.'}
          </p>
          <p style={{ lineHeight: 1.7, fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: '10px' }}>
            {isMarathi
              ? 'आज मंडळाचा हा प्रवास केवळ एका उत्सवाचा प्रवास नसून एकता, संस्कृती, सामाजिक सेवा, शैक्षणिक प्रोत्साहन आणि समाजहिताची प्रेरणा देणारी गौरवशाली परंपरा बनली आहे. भविष्यातही अधिक नाविन्यपूर्ण, समाजोपयोगी, शैक्षणिक आणि सांस्कृतिक उपक्रम राबवून मंडळाची सामाजिक व सांस्कृतिक ओळख अधिक मजबूत करण्याचा संकल्प आहे.'
              : 'Today, this journey is not just about celebrating a festival; it has evolved into a glorious legacy of unity, culture, social service, and community empowerment. Looking ahead, the Mandal remains dedicated to strengthening its social and cultural identity by organizing even more innovative, impactful, and educational initiatives.'}
          </p>
        </div>

        <div className="card card-gold-accent">
          <h2 style={{ fontSize: '1.35rem', marginBottom: '14px', color: 'var(--color-maroon-800)' }}>
            {t.about.aimsTitle}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {t.about.aims.map((aim, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <CheckCircle2 size={18} color="#2E7D32" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {aim}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Complete Committee Members Directory */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--color-maroon-800)' }}>
            {language === 'en' ? 'Committee & Executive Board' : 'मानद विश्वस्त व कार्यकारणी मंडळ'}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            मंडळाचे सुव्यवस्थित संचालन व उत्सव नियोजनासाठी कार्यरत मार्गदर्शक
          </p>
        </div>

        <div className="grid-3">
          {committee.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                border: '2px solid var(--color-gold-500)'
              }}>
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-maroon-800)', lineHeight: 1.3, marginBottom: '2px', wordBreak: 'break-word' }}>
                  {isMarathi ? item.nameMarathi : item.name}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-saffron-600)', marginBottom: '4px' }}>
                  {isMarathi ? item.designationMarathi : item.designationEnglish}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  <a
                    href={`tel:${item.phone.replace(/[^0-9+]/g, '')}`}
                    className="btn btn-primary btn-sm"
                    style={{
                      fontSize: '0.78rem',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      textDecoration: 'none',
                      backgroundColor: 'var(--color-maroon-700)',
                      color: '#ffffff',
                      boxShadow: '0 2px 4px rgba(135,28,28,0.2)'
                    }}
                    title="थेट कॉल करा (Direct Call)"
                  >
                    <PhoneCall size={12} />
                    <span>{item.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Temple Address & Map Location */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--color-maroon-800)' }}>
          {language === 'en' ? 'Temple & Office Location' : 'मंडळ कार्यालय व उत्सव मंडप पत्ता'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          <MapPin size={20} color="#871C1C" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
            {language === 'en' ? MANDAL_CONFIG.addressEnglish : MANDAL_CONFIG.addressMarathi}
          </div>
        </div>
        <div>
          <a
            href={MANDAL_CONFIG.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ExternalLink size={14} />
            <span>{t.common.directions}</span>
          </a>
        </div>
      </div>

      {/* MEMBER DIRECTORY MODAL (सभासद यादी मोडल) */}
      <Modal
        isOpen={isMemberListOpen}
        onClose={() => setIsMemberListOpen(false)}
        title={`दुर्गा मंडळ — अधिकृत सभासद सूची (${filteredMembers.length}/${members.length})`}
        maxWidth="820px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Search & Filter Bar */}
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="नाव, मोबाईल, शहर किंवा सभासद क्र. शोधा..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{ paddingLeft: '38px', minHeight: '42px', fontSize: '0.92rem', width: '100%' }}
            />
          </div>

          {/* Member List Cards Grid */}
          <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredMembers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                कोणतेही सभासद सापडले नाहीत. कृपया सर्च फिल्टर बदलून पहा.
              </div>
            ) : (
              filteredMembers.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-maroon-100)',
                      color: 'var(--color-maroon-800)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                      border: '1.5px solid var(--color-maroon-300)'
                    }}>
                      {m.photoUrl ? (
                        <img src={m.photoUrl} alt={m.fullName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        (m.fullNameMarathi || m.fullName || 'S').charAt(0)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--color-maroon-900)' }}>
                        {m.fullNameMarathi || m.fullName}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        📍 {m.cityVillage || 'चोप / गडचिरोली'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {m.phone && (
                      <a
                        href={`tel:${m.phone.replace(/[^0-9+]/g, '')}`}
                        className="btn btn-sm btn-primary"
                        style={{
                          fontSize: '0.78rem',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'none',
                          backgroundColor: 'var(--color-maroon-700)'
                        }}
                      >
                        <PhoneCall size={13} />
                        <span>कॉल करा</span>
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
