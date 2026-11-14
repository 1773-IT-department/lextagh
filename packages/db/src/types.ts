// Hand written from supabase/migrations/0001_foundations.sql, 0003_products.sql, 0005_stockists.sql, 0006_crm.sql and 0007_complaints.sql because the Supabase project
// was not reachable from the build shift. Replace with `generate_typescript_types` output
// once the migration is applied.

import type { Complaint, ComplaintEvent, ComplaintFile } from "./complaints";
import type { CrmActivity, CrmContact, CrmLead, CrmOrganisation, CrmOrganisationBrand, CrmStaff } from "./crm";

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

/** The stockist columns every role may read. created_by and updated_by are staff only (stockist_authors). */
export type StockistPublic = Omit<Stockist, "created_by" | "updated_by">;

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
      crm_organisations: {
        Row: CrmOrganisation;
        Insert: Partial<Omit<CrmOrganisation, "id" | "created_at" | "updated_at" | "created_by" | "updated_by">> & Pick<CrmOrganisation, "name">;
        Update: Partial<Omit<CrmOrganisation, "id" | "created_at" | "updated_at" | "created_by" | "updated_by">>;
        Relationships: [
          { foreignKeyName: "crm_organisations_region_id_fkey"; columns: ["region_id"]; isOneToOne: false; referencedRelation: "regions"; referencedColumns: ["id"] },
          { foreignKeyName: "crm_organisations_stockist_id_fkey"; columns: ["stockist_id"]; isOneToOne: false; referencedRelation: "stockists"; referencedColumns: ["id"] },
        ];
      };
      crm_organisation_brands: {
        Row: CrmOrganisationBrand;
        Insert: Pick<CrmOrganisationBrand, "organisation_id" | "brand_id">;
        Update: never;
        Relationships: [
          { foreignKeyName: "crm_organisation_brands_organisation_id_fkey"; columns: ["organisation_id"]; isOneToOne: false; referencedRelation: "crm_organisations"; referencedColumns: ["id"] },
          { foreignKeyName: "crm_organisation_brands_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
        ];
      };
      crm_contacts: {
        Row: CrmContact;
        Insert: Partial<Omit<CrmContact, "id" | "phone_key" | "consent_at" | "created_at" | "updated_at" | "created_by" | "updated_by">>;
        Update: Partial<Omit<CrmContact, "id" | "phone_key" | "consent_at" | "created_at" | "updated_at" | "created_by" | "updated_by">>;
        Relationships: [
          { foreignKeyName: "crm_contacts_organisation_id_fkey"; columns: ["organisation_id"]; isOneToOne: false; referencedRelation: "crm_organisations"; referencedColumns: ["id"] },
        ];
      };
      crm_leads: {
        Row: CrmLead;
        Insert: Partial<Omit<CrmLead, "id" | "intake_reference" | "submitted_organisation_name" | "closed_at" | "created_at" | "updated_at" | "created_by" | "updated_by">> & Pick<CrmLead, "title" | "source">;
        Update: Partial<Omit<CrmLead, "id" | "intake_reference" | "submitted_organisation_name" | "closed_at" | "created_at" | "updated_at" | "created_by" | "updated_by">>;
        Relationships: [
          { foreignKeyName: "crm_leads_contact_id_fkey"; columns: ["contact_id"]; isOneToOne: false; referencedRelation: "crm_contacts"; referencedColumns: ["id"] },
          { foreignKeyName: "crm_leads_organisation_id_fkey"; columns: ["organisation_id"]; isOneToOne: false; referencedRelation: "crm_organisations"; referencedColumns: ["id"] },
          { foreignKeyName: "crm_leads_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
        ];
      };
      crm_activities: {
        Row: CrmActivity;
        Insert: Pick<CrmActivity, "type" | "body"> & Partial<Pick<CrmActivity, "lead_id" | "contact_id" | "organisation_id" | "occurred_at">>;
        Update: never;
        Relationships: [
          { foreignKeyName: "crm_activities_lead_id_fkey"; columns: ["lead_id"]; isOneToOne: false; referencedRelation: "crm_leads"; referencedColumns: ["id"] },
          { foreignKeyName: "crm_activities_contact_id_fkey"; columns: ["contact_id"]; isOneToOne: false; referencedRelation: "crm_contacts"; referencedColumns: ["id"] },
          { foreignKeyName: "crm_activities_organisation_id_fkey"; columns: ["organisation_id"]; isOneToOne: false; referencedRelation: "crm_organisations"; referencedColumns: ["id"] },
        ];
      };
      complaints: {
        Row: Complaint;
        Insert: Partial<Pick<Complaint, "product_id" | "sku_id" | "batch_number" | "stockist_id" | "purchase_place" | "purchase_date" | "severity" | "organisation_id" | "owner_id">>
          & Pick<Complaint, "brand_id" | "category" | "channel" | "description" | "contact_id">;
        Update: Partial<Pick<Complaint, "brand_id" | "product_id" | "sku_id" | "batch_number" | "stockist_id" | "purchase_place" | "purchase_date" | "category" | "severity" | "channel" | "description" | "contact_id" | "organisation_id" | "owner_id" | "status" | "resolution_summary" | "root_cause">>;
        Relationships: [
          { foreignKeyName: "complaints_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
          { foreignKeyName: "complaints_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "complaints_sku_id_fkey"; columns: ["sku_id"]; isOneToOne: false; referencedRelation: "product_skus"; referencedColumns: ["id"] },
          { foreignKeyName: "complaints_stockist_id_fkey"; columns: ["stockist_id"]; isOneToOne: false; referencedRelation: "stockists"; referencedColumns: ["id"] },
          { foreignKeyName: "complaints_contact_id_fkey"; columns: ["contact_id"]; isOneToOne: false; referencedRelation: "crm_contacts"; referencedColumns: ["id"] },
          { foreignKeyName: "complaints_organisation_id_fkey"; columns: ["organisation_id"]; isOneToOne: false; referencedRelation: "crm_organisations"; referencedColumns: ["id"] },
        ];
      };
      complaint_events: {
        Row: ComplaintEvent;
        Insert: Pick<ComplaintEvent, "complaint_id" | "body"> & { type: "note" | "call" | "email"; occurred_at?: string };
        Update: never;
        Relationships: [
          { foreignKeyName: "complaint_events_complaint_id_fkey"; columns: ["complaint_id"]; isOneToOne: false; referencedRelation: "complaints"; referencedColumns: ["id"] },
        ];
      };
      complaint_files: {
        Row: ComplaintFile;
        Insert: Pick<ComplaintFile, "complaint_id" | "storage_path" | "file_name" | "mime_type" | "size_bytes">;
        Update: never;
        Relationships: [
          { foreignKeyName: "complaint_files_complaint_id_fkey"; columns: ["complaint_id"]; isOneToOne: false; referencedRelation: "complaints"; referencedColumns: ["id"] },
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
      can_add_stockist_brand: { Args: { target_stockist: string; target_brand: string }; Returns: boolean };
      set_stockist_active: { Args: { target_id: string; active: boolean }; Returns: undefined };
      delete_stockist: { Args: { target_id: string }; Returns: undefined };
      stockist_authors: { Args: { target_ids: string[] }; Returns: { stockist_id: string; created_by: string | null; updated_by: string | null }[] };
      update_my_profile: { Args: { new_full_name: string; new_phone: string }; Returns: undefined };
      crm_staff: { Args: Record<string, never>; Returns: CrmStaff[] };
      crm_can_see_org: { Args: { target_org: string }; Returns: boolean };
      crm_can_see_lead_id: { Args: { target_lead: string }; Returns: boolean };
      crm_can_edit_org: { Args: { target_org: string }; Returns: boolean };
      crm_can_note_org: { Args: { target_org: string }; Returns: boolean };
      crm_is_staff: { Args: { target_profile: string }; Returns: boolean };
      save_crm_organisation: { Args: { target_id: string | null; details: Record<string, unknown> | null; brand_ids: string[] | null }; Returns: string };
      save_crm_contact: { Args: { target_id: string | null; details: Record<string, unknown> }; Returns: string };
      save_crm_lead: { Args: { target_id: string | null; details: Record<string, unknown> }; Returns: string };
      set_crm_lead_stage: { Args: { target_id: string; new_stage: string; reason: string | null }; Returns: undefined };
      set_crm_owner: { Args: { kind: "lead" | "contact" | "organisation"; target_id: string; new_owner: string | null }; Returns: undefined };
      delete_crm_record: { Args: { kind: "lead" | "contact" | "organisation"; target_id: string }; Returns: undefined };
      submit_website_enquiry: { Args: { form: "contact" | "partner" | "newsletter"; payload: Record<string, unknown> }; Returns: string };
      complaint_can_see: { Args: { target_brand: string }; Returns: boolean };
      complaint_can_see_id: { Args: { target_complaint: string }; Returns: boolean };
      complaint_works: { Args: Record<string, never>; Returns: boolean };
      complaint_reassigns: { Args: Record<string, never>; Returns: boolean };
      complaint_is_owner_candidate: { Args: { target_profile: string }; Returns: boolean };
      save_complaint: { Args: { target_id: string | null; details: Record<string, unknown> }; Returns: string };
      set_complaint_status: { Args: { target_id: string; new_status: string; note: string | null; resolution_summary: string | null; root_cause: string | null }; Returns: undefined };
      set_complaint_owner: { Args: { target_id: string; new_owner: string | null }; Returns: undefined };
      delete_complaint: { Args: { target_id: string }; Returns: undefined };
      submit_complaint: { Args: { payload: Record<string, unknown> }; Returns: string };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<string, never>;
  };
};
