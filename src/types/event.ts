export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface MandalEvent {
  id: string;
  title: string;
  titleMarathi?: string;
  description: string;
  descriptionMarathi?: string;
  startDate: string; // ISO String
  endDate: string;   // ISO String
  timeString: string; // e.g. "सकाळी ०८:०० ते दुपारी १२:००"
  venue: string;
  venueMarathi?: string;
  venueMapUrl?: string;
  coverImageUrl: string;
  status: EventStatus;
  isRsvpEnabled: boolean;
  rsvpLimit?: number;
  rsvpCount: number;
  linkedAlbumId?: string;
  highlights?: string[];
  chiefGuest?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  phone: string;
  guestCount: number;
  notes?: string;
  createdAt: string;
}
