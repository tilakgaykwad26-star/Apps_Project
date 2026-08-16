export type UserRole = 
  | 'super_admin' 
  | 'treasurer' 
  | 'committee_admin' 
  | 'content_manager' 
  | 'member' 
  | 'guest';

export interface AppUser {
  uid: string;
  phone: string;
  displayName: string;
  email?: string;
  role: UserRole;
  memberId?: string;
  photoUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

export type MemberType = 'individual' | 'family';
export type MemberCategory = 'patron' | 'life' | 'annual' | 'honorary';
export type MemberStatus = 'active' | 'inactive';

export interface FamilyMember {
  name: string;
  relation: string;
  age?: number;
}

export interface Member {
  id: string;
  uid?: string;
  memberNumber: string;
  fullName: string;
  fullNameMarathi?: string;
  phone: string;
  email?: string;
  address: string;
  cityVillage: string;
  pincode?: string;
  memberType: MemberType;
  category: MemberCategory;
  photoUrl?: string;
  familyMembers?: FamilyMember[];
  status: MemberStatus;
  joinedDate: string; // ISO date YYYY-MM-DD
  annualDueAmount: number; // e.g. 500 or 1000
  createdAt: string;
  updatedAt: string;
}
