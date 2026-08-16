export type NoticePriority = 'normal' | 'important' | 'urgent';

export interface MandalNotice {
  id: string;
  title: string;
  titleMarathi?: string;
  message: string;
  messageMarathi?: string;
  priority: NoticePriority;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: 'pdf' | 'image' | 'doc';
  isPublished: boolean;
  publishedAt: string; // ISO date string
  expiresAt?: string;   // ISO date string
  publishedBy: string;  // Name or UID of admin
  viewCount?: number;
}
