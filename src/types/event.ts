
export type EventType = 'tournament' | 'special_class' | 'day_use' | 'private_event';
export type EventStatus = 'active' | 'inactive' | 'finished';

export interface Event {
  id?: string;
  name: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  event_type: EventType;
  registration_fee?: number;
  max_capacity?: number;
  banner_url?: string;
  status: EventStatus;
  block_courts: boolean;
  notify_clients: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  events_courts?: EventCourt[];
  event_registrations?: EventRegistration[];
}

export interface EventCourt {
  id: string;
  event_id: string;
  court_id: string;
  courts?: { name: string };
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_date: string;
  payment_status: string;
  attended?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}
