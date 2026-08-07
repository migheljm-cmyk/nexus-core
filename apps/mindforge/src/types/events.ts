export type EventCategory = 'SESSION' | 'GAME' | 'USER' | 'ADS' | 'BUSINESS';

export type SessionEvent = 
  | 'session_start'
  | 'session_resume'
  | 'session_end'
  | 'session_duration';

export type GameEvent = 
  | 'game_open'
  | 'game_start'
  | 'move'
  | 'pause'
  | 'resume'
  | 'restart'
  | 'hint'
  | 'victory'
  | 'defeat'
  | 'timeout'
  | 'abandon';

export type UserEvent = 
  | 'first_visit'
  | 'return_visit'
  | 'account_created'
  | 'guest_created'
  | 'favorite_game'
  | 'profile_completed';

export type AdsEvent = 
  | 'banner_loaded'
  | 'banner_clicked'
  | 'interstitial_loaded'
  | 'interstitial_show'
  | 'reward_show'
  | 'reward_complete';

export type BusinessEvent = 
  | 'daily_active_user'
  | 'weekly_active_user'
  | 'monthly_active_user'
  | 'retention_d1'
  | 'retention_d7'
  | 'retention_d30';

export type EventName = SessionEvent | GameEvent | UserEvent | AdsEvent | BusinessEvent;

export interface AnalyticsPayload {
  guest_id: string;
  category: EventCategory;
  event_name: EventName;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}