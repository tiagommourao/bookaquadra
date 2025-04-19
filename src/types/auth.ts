
export interface AuthUserView {
  id: string;
  email: string;
  last_sign_in_at: string;
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
