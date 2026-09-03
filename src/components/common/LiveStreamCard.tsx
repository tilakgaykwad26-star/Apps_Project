import React, { useState } from 'react';
import { Radio, Share2, Heart, ExternalLink, Sparkles, Users, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMandal } from '../../context/MandalContext';
import { useAuth } from '../../context/AuthContext';
import { extractYouTubeId } from '../../types/livestream';
import { useLivePresence } from '../../services/livePresenceService';

export const LiveStreamCard: React.FC = () => {
  const { liveStreamConfig, incrementPranam } = useMandal();
  const { user } = useAuth();
  const [hasBlessed, setHasBlessed] = useState(false);
  const [copied, setCopied] = useState(false);

  // 100% Real-Time Live Presence Tracking across Firebase Firestore & BroadcastChannel
  const realActiveViewers = useLivePresence(Boolean(liveStreamConfig?.isLive), user?.displayName || 'भाविक');

  // Total viewers = Real active connected sessions + any optional base count
  const baseOffset = liveStreamConfig?.baseViewers && liveStreamConfig.baseViewers > 1 ? (liveStreamConfig.baseViewers - 1) : 0;
  const liveViewers = realActiveViewers + baseOffset;

  if (!liveStreamConfig || !liveStreamConfig.isLive) {
    return null;
  }

  const videoId = extractYouTubeId(liveStreamConfig.youtubeUrl);
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=0&rel=0&enablejsapi=1`
    : null;

  const handlePranam = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    // Fire confetti from button location
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { x, y },
      colors: ['#FFB300', '#FF3D00', '#D50000', '#FFD54F']
    });

    setHasBlessed(true);
    await incrementPranam();
    setTimeout(() => setHasBlessed(false), 1200);
  };

  const handleShare = async () => {
    const text = `🔴 *सार्वजनिक बाल दुर्गा उत्सव मंडळ - थेट महाआरती / कार्यक्रम थेट प्रक्षेपण!*\n\n*${liveStreamConfig.title}*\n${liveStreamConfig.description || ''}\n\nथेट पाहण्यासाठी येथे क्लिक करा: ${window.location.href}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: liveStreamConfig.title,
          text,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to WhatsApp link
      }
    }

    window.open(whatsappUrl, '_blank');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="live-stream-card">
      {/* Header Info */}
      <div className="live-stream-header">
        <div className="live-stream-title-group">
          <span className="live-badge-pulse">
            <Radio size={15} className="animate-pulse" />
            LIVE
          </span>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FDE68A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {liveStreamConfig.title || 'सार्वजनिक बाल दुर्गा उत्सव - थेट प्रक्षेपण'}
            </h3>
            {liveStreamConfig.description && (
              <p style={{ fontSize: '0.82rem', color: 'rgba(254, 243, 199, 0.85)', margin: '2px 0 0 0' }}>
                {liveStreamConfig.description}
              </p>
            )}
          </div>
        </div>

        <div className="live-stream-stats-group">
          {/* Active Live Viewers Pill with Glowing Radar */}
          <div className="live-active-pill">
            <span className="live-green-radar" />
            <Users size={15} color="#34D399" />
            <span>
              <strong style={{ color: '#FFFFFF', fontSize: '0.95rem', marginRight: '4px' }}>{liveViewers}</strong>
              भाविक लाईव्ह पाहत आहेत
            </span>
          </div>

          {/* Pranam / Blessings Count */}
          <div className="live-pranam-pill">
            <Sparkles size={14} color="#FBBF24" />
            <span><strong>{liveStreamConfig.pranamCount || 0}</strong> भाविकांनी प्रणाम केला</span>
          </div>
        </div>
      </div>

      {/* Embedded Video Area */}
      <div className="live-video-container">
        {embedUrl ? (
          <iframe
            key={videoId}
            src={embedUrl}
            title={liveStreamConfig.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Radio size={48} color="#EF4444" className="animate-bounce" />
            <p style={{ color: '#FDE68A', fontWeight: 700, fontSize: '1rem', margin: 0 }}>
              थेट प्रक्षेपण सुरू आहे, परंतु लिंक अपडेट केली जात आहे...
            </p>
            <p style={{ color: '#D1D5DB', fontSize: '0.82rem', margin: 0 }}>
              कृपया काही सेकंदात पुन्हा तपासा किंवा थेट युट्यूबवर पहा.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="live-stream-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handlePranam}
            className={`btn-pranam-festive ${hasBlessed ? 'btn-pranam-blessed' : ''}`}
          >
            <Heart size={18} fill={hasBlessed ? '#1F1D1A' : '#FFFFFF'} />
            <span>🙏 भावपूर्ण प्रणाम ({liveStreamConfig.pranamCount || 0})</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="btn-share-festive"
          >
            <Share2 size={16} color="#34D399" />
            <span>{copied ? '✅ लिंक कॉपी झाली!' : '📤 शेअर करा'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#FDE68A', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Eye size={14} color="#FBBF24" />
            <span><strong>{liveViewers}</strong> जण सोबत पाहत आहेत</span>
          </div>

          {liveStreamConfig.youtubeUrl && (
            <a
              href={liveStreamConfig.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-youtube-link"
            >
              <span>YouTube वर उघडा</span>
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
