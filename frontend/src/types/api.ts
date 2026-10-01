// Auto-generated types from tcv2.Api DTOs

export enum Plan {
  Free = 0,
  GiggingBand = 1,
  Organization = 2
}

export enum SubscriptionStatus {
  None = 0,
  Active = 1,
  ScheduledToEnd = 2,
  Canceled = 3,
  PastDue = 4,
  Incomplete = 5
}

export interface BillingPlanChangedNotificationDto {
  orgId: string;
  eventType: string;
  plan: string;
  subscriptionStatus: string;
  planExpiresAt?: string;
  updatedAt: string;
}

export interface BulkChordSheetRequestDto {
  dtos: ChordSheetDto[];
  connectionId: string;
}

export interface BulkUploadSummaryDto {
  createdIds?: string[];
  totalProcessed?: number;
  successful?: number;
  failed?: number;
}

export interface ChordSheetDto {
  id?: string;
  orgId?: string;
  title?: string;
  artist?: string;
  content?: string;
  key?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InviteDto {
  id?: string;
  email?: string;
  invitedBy?: string;
  token?: string;
  used?: boolean;
  expiresAt?: string;
  createdAt?: string;
  organizationId?: string;
  role?: string;
  baseUrl?: string;
}

export interface OrgMemberDto {
  userId?: string;
  name?: string;
  email?: string;
  picture?: string;
  role?: string;
  joinedAt?: string;
}

export interface OrganizationDto {
  id?: string;
  ownerUserId?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  plan?: Plan;
  subscriptionStatus?: SubscriptionStatus;
  planExpiresAt?: string;
}

export interface OrganizationWithRoleDto extends OrganizationDto {
  role?: string;
}

export interface OutputDetailDto extends OutputDto {
  chordsheets?: ChordSheetDetails;
}

export interface ChordSheetDetails {
  key?: string;
  content?: string;
}

export interface OutputDto {
  id?: string;
  setListId?: string;
  chordSheetId?: string;
  targetKey?: string;
  capo?: number;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileDto {
  id?: string;
  userId?: string;
  orgId?: string;
  bio?: string;
  instruments?: string;
  musicalRole?: string;
  preferredKey?: string;
  website?: string;
}

export interface RoleDto {
  role?: string;
}

export interface SetListDetailDto extends SetListDto {
  outputs?: OutputDto[];
}

export interface SetListDto {
  id?: string;
  orgId?: string;
  canUsePaidControls?: boolean;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateMeDto {
  givenName?: string;
  familyName?: string;
}

export interface UserDetailDto {
  id?: string;
  email?: string;
  emailVerified?: boolean;
  auth0UserId?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  createdAt?: string;
  updatedAt?: string;
  profile?: ProfileDto;
  organizations?: OrganizationWithRoleDto[];
}

export interface UserDto {
  id?: string;
  email?: string;
  emailVerified?: boolean;
  auth0UserId?: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  createdAt?: string;
  updatedAt?: string;
  password?: string;
  inviteOrganizationId?: string;
}

