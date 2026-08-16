export interface GalleryAlbum {
  id: string;
  title: string;
  titleMarathi?: string;
  description?: string;
  coverImageUrl: string;
  eventId?: string;
  year: string; // e.g. "2026"
  imageCount: number;
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  albumId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  captionMarathi?: string;
  sortOrder: number;
  uploadedAt: string;
}
