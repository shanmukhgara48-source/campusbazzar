export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          college: string;
          avatar_url: string | null;
          verification_status: 'unverified' | 'email_verified' | 'pending_id' | 'id_verified';
          is_banned: boolean;
          is_shadow_banned: boolean;
          report_count: number;
          rating: number;
          sales_count: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          category: string;
          condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
          status: 'active' | 'sold' | 'reserved' | 'hidden' | 'pending_review';
          images: string[];
          college: string;
          views: number;
          is_flagged: boolean;
          flag_reason: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['listings']['Row'], 'id' | 'created_at' | 'views'>;
        Update: Partial<Database['public']['Tables']['listings']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      transactions: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          status: 'initiated' | 'accepted' | 'reserved' | 'meetup_set' | 'completed' | 'cancelled' | 'disputed';
          amount: number;
          meetup_location: string | null;
          meetup_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_id: string;
          target_type: 'listing' | 'user' | 'message';
          reason: string;
          description: string | null;
          resolved: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reports']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      shadow_ban_user: {
        Args: { user_id: string };
        Returns: void;
      };
      get_dashboard_stats: {
        Args: Record<string, never>;
        Returns: {
          total_users: number;
          active_listings: number;
          completed_transactions: number;
          open_reports: number;
        };
      };
    };
    Enums: Record<string, never>;
  };
}
