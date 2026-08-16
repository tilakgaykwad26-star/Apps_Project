export interface CommitteeMember {
  id: string;
  name: string;
  nameMarathi: string;
  designationMarathi: string; // e.g. अध्यक्ष, उपाध्यक्ष, सचिव, खजिनदार, सल्लागार, सदस्य
  designationEnglish: string; // e.g. President, Vice President, Secretary, Treasurer, Advisor, Executive Member
  phone: string;
  email?: string;
  photoUrl: string;
  hierarchyOrder: number; // 1 = President, 2 = VP, etc.
  isCoreMember: boolean;
  roleDescriptionMarathi?: string;
}
