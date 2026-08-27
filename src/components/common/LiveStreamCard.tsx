import React, { useState } from 'react';
import { Radio, Share2, Heart, ExternalLink, Sparkles, Volume2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMandal } from '../../context/MandalContext';
import { extractYouTubeId } from '../../types/livestream';

export const LiveStreamCard: React.FC = () => {
  const { liveStreamConfig, incrementPranam } = useMandal();
  const [hasBlessed, setHasBlessed] = useState(false);
  const [copied, setCopied] = useState(false);

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
    <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-red-500/30 bg-gradient-to-br from-red-950/90 via-amber-950/80 to-stone-900 text-white backdrop-blur-xl transition-all duration-300 hover:border-red-500/50 mb-8">
      {/* Glow Effects */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative p-4 md:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-lg shadow-red-600/40">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              LIVE
            </span>
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg text-amber-200 flex items-center gap-2">
              {liveStreamConfig.title || 'सार्वजनिक बाल दुर्गा उत्सव - थेट प्रक्षेपण'}
            </h3>
            {liveStreamConfig.description && (
              <p className="text-xs text-amber-100/80 line-clamp-1">
                {liveStreamConfig.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{liveStreamConfig.pranamCount || 0} भाविकांनी प्रणाम केला</span>
        </div>
      </div>

      {/* Embedded Video Area */}
      <div className="relative w-full aspect-video bg-black/90 flex items-center justify-center">
        {embedUrl ? (
          <iframe
            key={videoId}
            src={embedUrl}
            title={liveStreamConfig.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="text-center p-8 flex flex-col items-center gap-3">
            <Radio className="w-12 h-12 text-red-400 animate-bounce" />
            <p className="text-amber-200 font-semibold text-sm">
              थेट प्रक्षेपण सुरू आहे, परंतु लिंक अपडेट केली जात आहे...
            </p>
            <p className="text-xs text-stone-400">
              कृपया काही सेकंदात पुन्हा तपासा किंवा थेट युट्यूबवर पहा.
            </p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-black/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePranam}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 ${
              hasBlessed
                ? 'bg-amber-400 text-stone-900 scale-105'
                : 'bg-gradient-to-r from-amber-500 to-red-500 text-white hover:from-amber-400 hover:to-red-400 shadow-amber-500/25'
            }`}
          >
            <Heart className={`w-4 h-4 ${hasBlessed ? 'fill-stone-900 animate-bounce' : 'fill-white/30'}`} />
            <span>🙏 भावपूर्ण प्रणाम ({liveStreamConfig.pranamCount || 0})</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>{copied ? 'कॉपी झाले!' : 'शेअर करा'}</span>
          </button>
        </div>

        {liveStreamConfig.youtubeUrl && (
          <a
            href={liveStreamConfig.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-amber-300/90 hover:text-amber-200 transition-colors bg-black/40 px-3 py-1.5 rounded-lg border border-amber-500/20"
          >
            <span>YouTube वर उघडा</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
