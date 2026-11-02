// Hand written from supabase/migrations/0001_foundations.sql, 0003_products.sql and 0005_stockists.sql because the Supabase project
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

export type Region = Timestamps & {
  id: string;
  slug: string;
  name: string;
  is_in_ghana: boolean;
  sort_order: number;
};

export type OutletType = "supermarket" | "pharmacy" | "open_market" | "general_trade" | "distributor" | "other";

/** Outlet types in display order, with the words staff and visitors see. */
export const OUTLET_TYPES: readonly { value: OutletType; label: string }[] = [
  { value: "supermarket", label: "Supermarket" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "open_market", label: "Open market" },
  { value: "general_trade", label: "General trade / neighbourhood shop" },
  { value: "distributor", label: "Distributor" },
  { value: "other", label: "Other" },
] as const;

export function outletTypeLabel(value: string): string {
  return OUTLET_TYPES.find((o) => o.value === value)?.label ?? "Other";
}

export type Stockist = Timestamps & {
  id: string;
  name: string;
  outlet_type: OutletType;
  region_id: string;
  town: string;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  opening_hours: string | null;
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
};

export type StockistBrand = Timestamps & {
  id: string;
  stockist_id: string;
  brand_id: string;
};

/** Staff only. Never readable by website visitors. */
export type StockistNote = Timestamps & {
  id: string;
  stockist_id: string;
  notes: string;
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
      regions: {
        Row: Region;
        Insert: Partial<Region> & Pick<Region, "slug" | "name">;
        Update: Partial<Omit<Region, "id">>;
        Relationships: [];
      };
      stockists: {
        Row: Stockist;
        Insert: Partial<Omit<Stockist, "created_by" | "updated_by">> & Pick<Stockist, "name" | "outlet_type" | "region_id" | "town">;
        Update: Partial<Omit<Stockist, "id" | "created_by" | "updated_by">>;
        Relationships: [
          { foreignKeyName: "stockists_region_id_fkey"; columns: ["region_id"]; isOneToOne: false; referencedRelation: "regions"; referencedColumns: ["id"] },
        ];
      };
      stockist_brands: {
        Row: StockistBrand;
        Insert: Partial<StockistBrand> & Pick<StockistBrand, "stockist_id" | "brand_id">;
        Update: never;
        Relationships: [
          { foreignKeyName: "stockist_brands_stockist_id_fkey"; columns: ["stockist_id"]; isOneToOne: false; referencedRelation: "stockists"; referencedColumns: ["id"] },
          { foreignKeyName: "stockist_brands_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
        ];
      };
      stockist_notes: {
        Row: StockistNote;
        Insert: Partial<StockistNote> & Pick<StockistNote, "stockist_id" | "notes">;
        Update: Partial<Omit<StockistNote, "id">>;
        Relationships: [
          { foreignKeyName: "stockist_notes_stockist_id_fkey"; columns: ["stockist_id"]; isOneToOne: true; referencedRelation: "stockists"; referencedColumns: ["id"] },
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
      can_view_stockists: { Args: Record<string, never>; Returns: boolean };
      can_create_stockists: { Args: Record<string, never>; Returns: boolean };
      can_link_stockist_brand: { Args: { target_brand: string }; Returns: boolean };
      can_edit_stockist: { Args: { target_stockist: string }; Returns: boolean };
      save_stockist: { Args: { target_id: string | null; details: Record<string, unknown> | null; brand_ids: string[] }; Returns: string };
      import_stockists: { Args: { items: unknown[] }; Returns: number };
      update_my_profile: { Args: { new_full_name: string; new_phone: string }; Returns: undefined };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<string, never>;
  };
};
