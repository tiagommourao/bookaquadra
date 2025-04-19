
// Definição de tipos para a view auth_users_view
export interface AuthUserView {
  id: string;
  email: string;
  last_sign_in_at: string;
}

// Definição de tipos para o banco de dados Supabase
export type Database = {
  public: {
    Views: {
      auth_users_view: {
        Row: AuthUserView;
      };
    };
  };
};
