import { UserRole } from './auth';

export type AuditActionType =
  | 'member_create'
  | 'member_update'
  | 'member_delete'
  | 'payment_record'
  | 'payment_modify'
  | 'donation_record'
  | 'event_create'
  | 'event_update'
  | 'event_delete'
  | 'notice_publish'
  | 'notice_delete'
  | 'gallery_upload'
  | 'gallery_delete'
  | 'sponsor_update'
  | 'committee_update'
  | 'role_change'
  | 'settings_update';

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  role: UserRole;
  action: AuditActionType;
  targetCollection: string;
  targetId: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string; // ISO string
}
