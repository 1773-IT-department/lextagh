// Hand written from supabase/migrations/0001_foundations.sql and 0003_products.sql because the Supabase project
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

export type Product = Timestamps & {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  category: string | null;
  short_description: string | null;
  long_description: string | null;
  key_features: string[];
  usage_instructions: string | null;
  ingredients: string | null;
  is_published: boolean;
  sort_order: number;
  updated_by: string | null;
};

export type ProductSku = Timestamps & {
  id: string;
  product_id: string;
  sku_code: string;
  variant_name: string | null;
  pack_size_label: string;
  unit_quantity: number | null;
  unit: string | null;
  barcode: string | null;
  is_active: boolean;
  sort_order: number;
};

export type ProductImage = Timestamps & {
  id: string;
  product_id: string;
  storage_path: string | null;
  external_url: string | null;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
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
      products: {
        Row: Product;
        Insert: Partial<Omit<Product, "updated_by">> & Pick<Product, "brand_id" | "name" | "slug">;
        Update: Partial<Omit<Product, "id" | "updated_by">>;
        Relationships: [
          { foreignKeyName: "products_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
        ];
      };
      product_skus: {
        Row: ProductSku;
        Insert: Partial<ProductSku> & Pick<ProductSku, "product_id" | "sku_code" | "pack_size_label">;
        Update: Partial<Omit<ProductSku, "id">>;
        Relationships: [
          { foreignKeyName: "product_skus_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
      product_images: {
        Row: ProductImage;
        Insert: Partial<ProductImage> & Pick<ProductImage, "product_id" | "alt_text">;
        Update: Partial<Omit<ProductImage, "id">>;
        Relationships: [
          { foreignKeyName: "product_images_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_app_role: { Args: Record<string, never>; Returns: AppRole | null };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      sees_all_brands: { Args: Record<string, never>; Returns: boolean };
      has_brand_access: { Args: { target_brand: string }; Returns: boolean };
      can_view_brand_products: { Args: { target_brand: string }; Returns: boolean };
      can_edit_brand_products: { Args: { target_brand: string }; Returns: boolean };
      can_manage_product_object: { Args: { object_name: string }; Returns: boolean };
      set_primary_product_image: { Args: { target_image: string }; Returns: undefined };
      update_my_profile: { Args: { new_full_name: string; new_phone: string }; Returns: undefined };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<string, never>;
  };
};
