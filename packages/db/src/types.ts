// Hand written from supabase/migrations/0001_foundations.sql because the Supabase project
// was not reachable from the build shift. Replace with `generate_typescript_types` output
// once the migration is applied.

export type AppRole =
  | "admin"
  | "management"
  | "sales_rep"
  | "distributor"
  | "customer_care"
  | "hr"
  | "marketing";

export const APP_ROLES: readonly AppRole[] = [
  "admin", "management", "sales_rep", "distributor", "customer_care", "hr", "marketing",
] as const;

type Timestamps = { created_at: string; updated_at: string };

export type Brand = Timestamps & {
  id: string;
  slug: string;
  name: string;
  website_url: string | null;
  is_corporate: boolean;
  is_active: boolean;
};

export type Profile = Timestamps & {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole | null;
  is_active: boolean;
};

export type ProfileBrand = Timestamps & {
  id: string;
  profile_id: string;
  brand_id: string;
};

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: Brand;
        Insert: Partial<Brand> & Pick<Brand, "slug" | "name">;
        Update: Partial<Brand>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: never;
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      profile_brands: {
        Row: ProfileBrand;
        Insert: Partial<ProfileBrand> & Pick<ProfileBrand, "profile_id" | "brand_id">;
        Update: Partial<ProfileBrand>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: AppRole | null };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      sees_all_brands: { Args: Record<string, never>; Returns: boolean };
      has_brand_access: { Args: { target_brand: string }; Returns: boolean };
      update_my_profile: { Args: { new_full_name: string; new_phone: string }; Returns: undefined };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<string, never>;
  };
};
