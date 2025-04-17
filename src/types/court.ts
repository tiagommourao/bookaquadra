
// Tipos para quadras e disponibilidade
export interface Court {
  id: string;
  name: string;
  description: string | null;
  type_id: string;
  image_url: string | null;
  is_active: boolean;
  has_cover: boolean;
  has_lighting: boolean;
  surface_type: string | null;
  capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface AvailableTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  available: boolean;
  blockReason?: string | null;
}

export interface Schedule {
  id: string;
  court_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  price: number;
  price_weekend?: number | null;
  price_holiday?: number | null;
  is_blocked: boolean;
  min_booking_time: number;
  max_booking_time?: number | null;
  advance_booking_days?: number | null;
  is_monthly?: boolean;
  monthly_discount?: number | null;
}

export interface ScheduleBlock {
  id: string;
  court_id: string;
  start_datetime: string;
  end_datetime: string;
  reason: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}
