export type EventStatus = 'active' | 'draft' | 'completed';

export interface Checkpoint {
  id: string;
  number: number;
  name: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  qrCodeValue: string;
  points: number;
  clue: string;
  challengeType: 'qr_only' | 'riddle' | 'photo' | 'physical_game' | 'quiz';
  challengeDescription: string;
  isMandatory: boolean;
  autoLockMinutes?: number;
  status?: 'locked' | 'active' | 'completed';
  markerColor?: string;
  markerIcon?: string;
  markerCustomImage?: string;
  markerShape?: 'pin' | 'circle' | 'square' | 'shield' | 'hexagon';
  radiusMeters?: number;
}

export interface TeamMember {
  name: string;
  role: 'Ketua Tim' | 'Navigators' | 'Anggota';
  phone?: string;
}

export interface CheckpointVisit {
  checkpointId: string;
  checkpointName: string;
  timestamp: number;
  timeString: string;
  points: number;
  status: 'completed' | 'verified';
  method: 'QR Scan' | 'Manual' | 'Photo Mission';
}

export interface Team {
  id: string;
  eventId?: string;
  clientId?: string;
  name: string;
  category: string;
  color: string;
  bibNumber: string;
  members: TeamMember[];
  checkpointsCompleted: number;
  totalCheckpoints: number;
  currentCheckpointId: string;
  points: number;
  bonusPoints: number;
  penaltyPoints: number;
  penaltyMinutes?: number;
  totalScore: number;
  startTime: string;
  durationMinutes: number;
  status: 'racing' | 'finished' | 'dnf' | 'ready';
  lastPosName: string;
  lastUpdated: string;
  lastCheckinTimestamp?: number;
  visitHistory?: CheckpointVisit[];
  currentCoordinates?: { lat: number; lng: number };
}

/**
 * Separate schema for private credentials stored in 'teamCredentials' collection.
 * Accessible ONLY by backend/Firebase Admin SDK.
 */
export interface TeamCredentials {
  teamId: string;
  bibNumber: string;
  pinCode?: string;
  hashedPin?: string;
  salt?: string;
  updatedAt?: string;
}

export type TeamCredential = TeamCredentials;

import { GPXRouteData } from '../utils/gpxParser';

export interface EventItem {
  id: string;
  clientId?: string;
  title: string;
  subtitle: string;
  eventType: 'orienteering' | 'amazing_race' | 'outbound' | 'school' | 'indoor_qr';
  status: EventStatus;
  date: string;
  timeRange: string;
  location: string;
  totalTeams: number;
  totalCheckpoints: number;
  timeLimitMinutes: number;
  organizerName: string;
  description: string;
  bannerGradient: string;
  rules?: string[];
  minIntervalBetweenCheckpointsSeconds?: number;
  enforceMinInterval?: boolean;
  visibility?: 'public' | 'private';
  eventCode?: string;
  showScoreToParticipants?: boolean;
  showCertificateToParticipants?: boolean;
  showParticipantMap?: boolean;
  autoLockCheckpointsEnabled?: boolean;
  autoLockCheckpointsMinutes?: number;
  gpxRouteData?: GPXRouteData;
  scoringRules?: {
    penaltyPerLateMin: number;
    maxLateMinutes: number;
    mandatoryBonus: number;
    judgeMaxScore: number;
    minIntervalSeconds?: number;
    defaultViolationPenaltyPoints?: number;
    defaultViolationPenaltyMinutes?: number;
  };
  gpsPolicy?: {
    required: boolean;
    validationRadiusMeters: number;
    maxAccuracyMeters: number;
    allowRecreationalBypass?: boolean;
  };
}

export type OfflineScanStatus = 
  | 'LOCAL_SAVED'
  | 'SYNC_PENDING'
  | 'SERVER_CONFIRMED'
  | 'REJECTED'
  | 'GPS_REVIEW_REQUIRED';

export interface ChallengeSubmission {
  id: string;
  eventId?: string;
  teamId: string;
  teamName: string;
  checkpointId: string;
  checkpointName: string;
  submittedAt: string;
  type: 'photo' | 'video' | 'quiz_answer' | 'physical_verification' | 'penalty';
  contentUrl?: string;
  contentText?: string;
  status: 'pending' | 'approved' | 'rejected';
  scoreGiven?: number;
  penaltyMinutesAdded?: number;
  judgeNote?: string;
}

export type OrganizerMenu = 
  | 'dashboard'
  | 'events'
  | 'checkpoints'
  | 'teams'
  | 'challenges'
  | 'scoring'
  | 'results'
  | 'settings';

export type RaceControlStatus = 'not_started' | 'running' | 'paused' | 'ended';

export interface RaceLog {
  id: string;
  time: string;
  message: string;
  type: 'checkin' | 'judge' | 'system' | 'registration';
}

export interface RaceBroadcast {
  id: string;
  time: string;
  title: string;
  message: string;
  type: 'urgent' | 'info' | 'weather' | 'clue';
  author: string;
}

export interface SosAlert {
  id: string;
  teamId: string;
  teamName: string;
  bibNumber: string;
  timestamp: number;
  timeString: string;
  coordinates: { lat: number; lng: number };
  status: 'active' | 'resolved';
}

// Multi-Tenant SaaS & Auth Interfaces for Stage 2 Foundation

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_CLIENT' | 'JUDGE_FACILITATOR' | 'PARTICIPANT';

export type ClientStatus = 'active' | 'suspended' | 'expired';

export interface ClientAccount {
  id: string; // clientId
  name: string;
  email: string;
  phone?: string;
  status: ClientStatus;
  startDate: string; // ISO 8601 UTC
  expiresAt: string; // ISO 8601 UTC
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  clientId?: string; // Mandatory for ADMIN_CLIENT
  assignedEventIds?: string[]; // Optional for JUDGE_FACILITATOR
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionHistoryItem {
  id: string;
  clientId: string;
  extendedByUid: string;
  extendedByEmail?: string;
  previousExpiresAt: string | null;
  newExpiresAt: string;
  extensionDays: number;
  paymentAmount?: number | null;
  paymentRef?: string | null;
  paymentDate?: string;
  notes?: string;
  timestamp: string;
}

export interface AuditLogItem {
  id: string;
  actorUid: string;
  actorRole: UserRole;
  action: string;
  targetId?: string;
  details?: Record<string, any>;
  timestamp: string;
}



