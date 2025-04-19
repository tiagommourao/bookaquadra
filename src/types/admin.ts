
export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  level: string;
  points: number;
  sports: Array<{ name: string; level: string }>;
  status: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  avatarUrl: string | null;
  badges: Array<{ name: string; icon: string }>;
}
