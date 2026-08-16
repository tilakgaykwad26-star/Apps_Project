import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useMandal } from '../context/MandalContext';
import { GalleryAlbum, GalleryImage } from '../types/gallery';
import { toMarathiDigits } from '../utils/dateUtils';
import {
  Image as ImageIcon,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Calendar,
  Layers
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const GalleryPage: React.FC = () => {
  const { language, t, isMarathi } = useLanguage();
  const { albums, images } = useMandal();

  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null);

  const albumImages = selectedAlbum
    ? images.filter((img) => img.albumId === selectedAlbum.id)
    : [];

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImageIndex(null);
  };

  const nextImage = () => {
    if (lightboxImageIndex !== null && albumImages.length > 0) {
      setLightboxImageIndex((lightboxImageIndex + 1) % albumImages.length);
    }
  };

  const prevImage = () => {
    if (lightboxImageIndex !== null && albumImages.length > 0) {
      setLightboxImageIndex((lightboxImageIndex - 1 + albumImages.length) % albumImages.length);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImageIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImageIndex, albumImages.length]);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', paddingTop: 'var(--space-lg)' }}>
      {/* 1. Header & Navigation */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.1rem', color: 'var(--color-maroon-800)', marginBottom: '8px' }}>
          {selectedAlbum ? (isMarathi ? selectedAlbum.titleMarathi || selectedAlbum.title : selectedAlbum.title) : t.gallery.title}
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
          {selectedAlbum
            ? selectedAlbum.description || 'उत्सवातील सुंदर क्षणचित्रे'
            : (language === 'en' ? 'Explore visual highlights and spiritual memories of our Durga Utsav celebrations.' : 'शारदीय नवरात्रोत्सव, होम-हवन, महाप्रसाद आणि दीपोत्सवाच्या नयनरम्य आठवणी')}
        </p>
      </div>

      {selectedAlbum && (
        <div>
          <button
            onClick={() => setSelectedAlbum(null)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>{t.gallery.backToAlbums}</span>
          </button>
        </div>
      )}

      {/* 2. Album View vs Images View */}
      {!selectedAlbum ? (
        albums.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={t.gallery.emptyGallery}
            description="उत्सवाचे नवीन फोटो लवकरच अपलोड केले जातील."
          />
        ) : (
          <div className="grid-3">
            {albums.map((alb) => (
              <div
                key={alb.id}
                className="card card-interactive"
                onClick={() => setSelectedAlbum(alb)}
                style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ position: 'relative', height: '220px', width: '100%', overflow: 'hidden' }}>
                  <img
                    src={alb.coverImageUrl}
                    alt={alb.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(33, 33, 33, 0.8)',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Layers size={12} />
                    <span>{toMarathiDigits(alb.imageCount || 5)} {t.gallery.photosCount}</span>
                  </div>
                </div>

                <div style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-saffron-600)', fontWeight: 700, marginBottom: '2px' }}>
                      वर्ष {toMarathiDigits(alb.year)}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--color-maroon-800)', marginBottom: '4px' }}>
                      {isMarathi ? alb.titleMarathi || alb.title : alb.title}
                    </h3>
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: 'var(--space-sm)',
                    marginTop: 'var(--space-sm)',
                    color: 'var(--color-maroon-700)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{t.gallery.viewAlbum}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Detailed Images Grid */
        albumImages.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title={t.gallery.emptyGallery}
            actionText={t.gallery.backToAlbums}
            onAction={() => setSelectedAlbum(null)}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--space-md)'
          }}>
            {albumImages.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => openLightbox(idx)}
                style={{
                  position: 'relative',
                  height: '240px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <img
                  src={img.thumbnailUrl || img.imageUrl}
                  alt={img.captionMarathi || 'उत्सव फोटो'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                  loading="lazy"
                />
                {img.captionMarathi && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    padding: '24px 12px 8px 12px',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 600
                  }}>
                    {img.captionMarathi}
                  </div>
                )}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  padding: '4px',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex'
                }}>
                  <Maximize2 size={14} />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* 3. Full-Screen Lightbox Modal */}
      {lightboxImageIndex !== null && albumImages[lightboxImageIndex] && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.94)',
            zIndex: 2500,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 'var(--space-md)'
          }}
          onClick={closeLightbox}
        >
          {/* Top Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
            zIndex: 10
          }}>
            <div style={{ fontSize: '0.9rem', color: '#D4AF37', fontWeight: 600 }}>
              {toMarathiDigits(lightboxImageIndex + 1)} / {toMarathiDigits(albumImages.length)}
            </div>
            <button
              onClick={closeLightbox}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Center Image with Previous/Next Controls */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '10px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={prevImage}
              style={{
                position: 'absolute',
                left: '10px',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>

            <img
              src={albumImages[lightboxImageIndex].imageUrl}
              alt="Full size preview"
              style={{
                maxWidth: '90vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }}
            />

            <button
              onClick={nextImage}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Caption */}
          <div style={{ textAlign: 'center', color: '#FAF7F2', padding: '10px', zIndex: 10 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {albumImages[lightboxImageIndex].captionMarathi || ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
