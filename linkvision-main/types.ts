
export type EventType = 'success' | 'error';
export type Language = string;
export type VideoQuality = '480p' | '720p' | '1080p' | '1440p' | '4K';
export type FeedbackType = 'bug' | 'suggestion' | 'other';
export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '9:16' | '16:9' | '21:9';

export interface UserSettings {
  language: Language;
  videoQuality: VideoQuality;
  autoStart: boolean;
  theme?: 'dark' | 'light';
}

export interface PerformanceEvent {
  id: string;
  timestamp: string;
  type: EventType;
  category?: 'Footwork' | 'Timing' | 'Technique' | 'Tactical' | 'Line Call';
  description: string;
  isLineCall?: boolean;
  callType?: 'IN' | 'OUT' | 'NET';
  isCalibrated?: boolean;
  movement?: string;
  location?: string;
}

export interface CourtPlace {
  id: string;
  name: string;
  address?: string;
  link?: string;
  surface?: string;
}

export interface HittingPartner {
  id: string;
  name: string;
  rating: number;
  level: string;
  region: string;
  isOfficial: boolean;
  videoUrl?: string;
  specialty: string;
}

export interface RankedAthlete {
  id: string;
  name: string;
  points: number;
  level: 'A' | 'B' | 'C' | 'Pro';
  age: number;
  category: 'singles' | 'doubles';
  gender: 'male' | 'female' | 'mixed';
  winRate: number;
  tournamentPoints?: number;
}

export interface Tournament {
  id: string;
  creatorId: string;
  name: string;
  location: string;
  description: string;
  rules: string;
  logoUrl?: string;
  placeImageUrl?: string;
  courtType: 'Clay' | 'Hard' | 'Grass' | 'Indoors';
  categories: string[];
  prizes: string;
  drawSize: number;
  gender: 'male' | 'female' | 'mixed' | 'all';
  format: 'singles' | 'doubles';
  status: 'open' | 'ongoing' | 'finished';
  participants: string[];
  startDate: string;
}

export interface RacketSpec {
  id: string;
  name: string;
  brand: string;
  weight: string;
  headSize: string;
  stringPattern: string;
  balance: string;
  swingweight: string;
  stiffness: string;
  powerLevel: number;
  controlLevel: number;
  comfortLevel: number;
  playerType: string;
  recommendedLevel: string;
  proPlayers: string[];
  summary: string;
  pros: string[];
  cons: string[];
  priceValue: number;
  priceDisplay?: string; // Added for flexible currency display
  imageUrl?: string;
  isAiGenerated?: boolean;
  year?: number;
}

export interface AnalysisResult {
  id: string;
  date: string;
  summary: {
    successRate: number;
    errorRate: number;
    totalSuccesses: number;
    totalErrors: number;
    totalEvents: number;
    lineAccuracy?: number;
    technicalScorecard?: {
      consistency: number;
      power: number;
      footwork: number;
      precision: number;
    };
  };
  events: PerformanceEvent[];
  sportType: string;
  playerStats?: {
    forehandSuccess: number;
    backhandSuccess: number;
    serveAccuracy: number;
    technicalConsistency: number;
  };
}

export interface AppState {
  view: 'judge' | 'rackets' | 'news' | 'torneios' | 'ranking' | 'courts' | 'success' | 'canceled';
  judgeMode: 'video' | 'realtime';
  videoFile: File | null;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  history: AnalysisResult[];
  savedPlaces: CourtPlace[];
  error: string | null;
  language: Language;
  videoQuality: VideoQuality;
  autoStart: boolean;
  isFeedbackOpen: boolean;
  user: any | null;
  isLanguageModalOpen: boolean;
  isSettingsModalOpen?: boolean;
}
