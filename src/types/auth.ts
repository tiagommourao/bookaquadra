
export interface AuthUserView {
  id: string | null;
  email: string | null;
  last_sign_in_at: string | null;
}

export type Database = {
  public: {
    Views: {
      auth_users_view: {
        Row: AuthUserView;
      };
    };
  };
};
