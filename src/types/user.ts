export interface UserPrivacySettings {
  hideMajor: boolean;
  allowDirectMessages: boolean;
  revealNameOnMutualFollow: boolean;
  autoExpireHangouts: boolean;
}

export interface IUser {
  _id?: string;
  email: string;
  emailVerified: boolean;
  universityDomain: string;
  universityName: string;
  pseudonym: string;
  avatarColor: string;
  avatarIcon: string;
  major?: string;
  graduationYear?: number;
  bio?: string;
  interests: string[];
  sparksCount: number; // Campus reputation/spark points
  privacySettings: UserPrivacySettings;
  createdAt: Date;
  updatedAt: Date;
}
