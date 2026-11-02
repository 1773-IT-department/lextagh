"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PRODUCT_IMAGES_BUCKET } from "@lexta/db";
import { getProductAccess, slugify } from "@/lib/products";
import { notifySites } from "@/lib/revalidate-sites";
import { createClient } from "@/lib/supabase/server";

export type ProductFormState = { error?: string; message?: string; fieldErrors?: Record<string, string> };
export type ActionResult = { error?: string };

type SkuInput = {
  id?: string;
  sku_code: string;
  variant_name: string | null;
  pack_size_label: string;
  unit_quantity: number | null;
  unit: string | null;
  barcode: string | null;
  is_active: boolean;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SKU_CODE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const optional = (value: string) => (value === "" ? null : value);

const NO_PERMISSION = "You do not have permission to change products of this brand.";

async function requireEditor() {
  const access = await getProductAccess();
  if (!access.canEdit) return { access, error: "Your role can view products but not change them." };
  return { access, error: undefined };
}

function afterChange(productId: string, reason: string) {
  revalidatePath("/systems/products");
  revalidatePath(`/systems/products/${productId}`);
  return notifySites(reason);
}

function parseSkus(raw: string): { skus: SkuInput[]; error?: string } {
  let rows: unknown;
  try {
    rows = JSON.parse(raw || "[]");
  } catch {
    return { skus: [], error: "The SKU list could not be read. Please reload the page and try again." };
  }
  if (!Array.isArray(rows)) return { skus: [], error: "The SKU list could not be read." };
  const skus: SkuInput[] = [];
  const seen = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const r = (row ?? {}) as Record<string, unknown>;
    const line = index + 1;
    const code = String(r.sku_code ?? "").trim();
    const pack = String(r.pack_size_label ?? "").trim();
    const qtyRaw = String(r.unit_quantity ?? "").trim();
    const barcode = String(r.barcode ?? "").trim();
    if (!code && !pack) continue; // an empty row the person never filled in
    if (!SKU_CODE.test(code)) return { skus, error: `SKU ${line}: the code may use letters, numbers, dots, dashes and underscores (up to 64).` };
    if (seen.has(code.toUpperCase())) return { skus, error: `SKU ${line}: the code ${code} is listed twice.` };
    seen.add(code.toUpperCase());
    if (!pack) return { skus, error: `SKU ${line}: enter a pack size, for example 375g or 80 pieces.` };
    const qty = qtyRaw === "" ? null : Number(qtyRaw);
    if (qty !== null && (!Number.isFinite(qty) || qty <= 0)) return { skus, error: `SKU ${line}: quantity must be a number above zero, or empty.` };
    if (barcode && !/^[0-9]{6,14}$/.test(barcode)) return { skus, error: `SKU ${line}: the barcode must be 6 to 14 digits, or empty.` };
    const id = typeof r.id === "string" && UUID.test(r.id) ? r.id : undefined;
    skus.push({
      id,
      sku_code: code,
      variant_name: optional(String(r.variant_name ?? "").trim()),
      pack_size_label: pack,
      unit_quantity: qty,
      unit: optional(String(r.unit ?? "").trim()),
      barcode: optional(barcode),
      is_active: r.is_active !== false,
    });
  }
  return { skus };
}

/** Create or update a product with its approved information and SKUs. */
export async function saveProduct(_prev: ProductFormState, form: FormData): Promise<ProductFormState> {
  const { access, error: roleError } = await requireEditor();
  if (roleError) return { error: roleError };

  const id = text(form, "id");
  const isNew = id === "";
  if (!isNew && !UUID.test(id)) return { error: "This product could not be found." };

  const name = text(form, "name");
  const slug = text(form, "slug") || slugify(name);
  const brandId = text(form, "brand_id");
  const sortRaw = text(form, "sort_order");
  const sortOrder = sortRaw === "" ? 0 : Number(sortRaw);
  const fieldErrors: Record<string, string> = {};

  if (!name) fieldErrors.name = "Enter the product name.";
  else if (name.length > 160) fieldErrors.name = "Keep the name under 160 characters.";
  if (!SLUG.test(slug) || slug.length > 120) fieldErrors.slug = "Use lowercase letters, numbers and single dashes, for example baby-wipes.";
  if (isNew && !access.brands.some((b) => b.id === brandId)) fieldErrors.brand_id = "Choose one of your brands.";
  if (!Number.isInteger(sortOrder)) fieldErrors.sort_order = "Use a whole number.";
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors };

  const { skus, error: skuError } = parseSkus(String(form.get("skus") ?? "[]"));
  if (skuError) return { error: skuError };

  const keyFeatures = String(form.get("key_features") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const fields = {
    name,
    slug,
    category: optional(text(form, "category")),
    short_description: optional(text(form, "short_description")),
    long_description: optional(text(form, "long_description")),
    key_features: keyFeatures,
    usage_instructions: optional(text(form, "usage_instructions")),
    ingredients: optional(text(form, "ingredients")),
    is_published: form.get("is_published") === "on",
    sort_order: sortOrder,
  };

  const supabase = await createClient();
  let productId = id;

  if (isNew) {
    const { data, error } = await supabase.from("products").insert({ ...fields, brand_id: brandId }).select("id").single();
    if (error) return productError(error);
    productId = data.id as string;
  } else {
    // The brand is fixed after creation: uploaded images live in the brand's folder.
    const { data, error } = await supabase.from("products").update(fields).eq("id", productId).select("id");
    if (error) return productError(error);
    if (!data?.length) return { error: NO_PERMISSION };
  }

  // SKUs: remove the ones taken out, update the ones kept, add the new ones.
  const { data: existing, error: loadError } = await supabase.from("product_skus").select("id").eq("product_id", productId);
  if (loadError) return { error: "The product was saved, but its SKUs could not be loaded. Please try again." };
  const keep = new Set(skus.filter((s) => s.id).map((s) => s.id));
  const removeIds = (existing ?? []).map((s) => s.id as string).filter((sid) => !keep.has(sid));
  if (removeIds.length) {
    const { error } = await supabase.from("product_skus").delete().in("id", removeIds);
    if (error) return { error: "The product was saved, but removed SKUs could not be deleted. Please try again." };
  }
  for (const [index, sku] of skus.entries()) {
    const { id: skuId, ...row } = sku;
    const values = { ...row, sort_order: (index + 1) * 10 };
    const { error } = skuId
      ? await supabase.from("product_skus").update(values).eq("id", skuId).eq("product_id", productId)
      : await supabase.from("product_skus").insert({ ...values, product_id: productId });
    if (error) {
      if (isNew) {
        // The product exists now; continue on its edit page so a second save does not create it twice.
        await afterChange(productId, "product created");
        redirect(`/systems/products/${productId}?created=1&sku_error=${encodeURIComponent(sku.sku_code)}`);
      }
      return {
        error: error.code === "23505"
          ? `The product was saved, but SKU code ${sku.sku_code} is already used by another product.`
          : `The product was saved, but SKU ${sku.sku_code} could not be saved. Please try again.`,
      };
    }
  }

  await afterChange(productId, isNew ? "product created" : "product updated");
  if (isNew) redirect(`/systems/products/${productId}?created=1`);
  return { message: fields.is_published ? "Saved. The websites will show the change shortly." : "Saved as a draft. It is not on the websites." };
}

function productError(error: { code?: string; message: string }): ProductFormState {
  if (error.code === "23505") return { error: "Another product of this brand already uses that web address.", fieldErrors: { slug: "Already used in this brand. Choose another." } };
  if (error.code === "42501") return { error: NO_PERMISSION };
  if (error.code === "23514") return { error: "One of the fields is too long or in the wrong format. Please check and try again." };
  console.error("[products] save failed", error);
  return { error: "We could not save the product. Please try again." };
}

/** Publish or unpublish. Bound in the form: setPublished.bind(null, id, true). */
export async function setPublished(productId: string, publish: boolean): Promise<void> {
  const { error: roleError } = await requireEditor();
  if (roleError || !UUID.test(productId)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ is_published: publish }).eq("id", productId);
  if (error) console.error("[products] publish failed", error);
  await afterChange(productId, publish ? "product published" : "product unpublished");
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error: roleError } = await requireEditor();
  if (roleError || !UUID.test(productId)) return;
  const supabase = await createClient();
  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", productId);
  const paths = (images ?? []).map((i) => i.storage_path as string | null).filter((p): p is string => !!p);
  const { data, error } = await supabase.from("products").delete().eq("id", productId).select("id");
  if (error || !data?.length) {
    console.error("[products] delete failed", error);
    redirect(`/systems/products/${productId}?error=delete`);
  }
  if (paths.length) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  await afterChange(productId, "product deleted");
  redirect("/systems/products?deleted=1");
}

// Images ---------------------------------------------------------------------------------

async function loadProductForImages(productId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, brand:brands(slug)").eq("id", productId).maybeSingle();
  const brand = data?.brand as { slug: string } | { slug: string }[] | null | undefined;
  const slug = Array.isArray(brand) ? brand[0]?.slug : brand?.slug;
  return { supabase, product: data, brandSlug: slug };
}

async function nextImageOrder(supabase: Awaited<ReturnType<typeof createClient>>, productId: string) {
  const { data } = await supabase.from("product_images").select("sort_order, is_primary").eq("product_id", productId);
  const rows = data ?? [];
  return {
    sortOrder: rows.reduce((m, r) => Math.max(m, r.sort_order as number), 0) + 10,
    hasPrimary: rows.some((r) => r.is_primary),
  };
}

/** Records a file the browser has just uploaded to the product-images bucket. */
export async function addUploadedImage(productId: string, storagePath: string, altText: string): Promise<ActionResult> {
  const { error: roleError } = await requireEditor();
  if (roleError) return { error: roleError };
  const alt = altText.trim();
  if (!alt) return { error: "Describe the image in the alt text so everyone can understand it." };
  const { supabase, product, brandSlug } = await loadProductForImages(productId);
  if (!product || !brandSlug) return { error: "This product could not be found." };
  if (!storagePath.startsWith(`${brandSlug}/${productId}/`) || storagePath.split("/").length !== 3) {
    return { error: "The upload went to the wrong folder. Please try again." };
  }
  const { sortOrder, hasPrimary } = await nextImageOrder(supabase, productId);
  const { error } = await supabase.from("product_images").insert({
    product_id: productId, storage_path: storagePath, alt_text: alt, sort_order: sortOrder, is_primary: !hasPrimary,
  });
  if (error) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath]);
    return { error: error.code === "42501" ? NO_PERMISSION : "The image could not be saved. Please try again." };
  }
  await afterChange(productId, "image added");
  return {};
}

/** Adds an image by https link (for photos already hosted elsewhere). */
export async function addLinkedImage(productId: string, url: string, altText: string): Promise<ActionResult> {
  const { error: roleError } = await requireEditor();
  if (roleError) return { error: roleError };
  const alt = altText.trim();
  const link = url.trim();
  if (!alt) return { error: "Describe the image in the alt text so everyone can understand it." };
  try {
    if (new URL(link).protocol !== "https:") throw new Error();
  } catch {
    return { error: "Use a full link that starts with https://" };
  }
  const supabase = await createClient();
  const { sortOrder, hasPrimary } = await nextImageOrder(supabase, productId);
  const { error } = await supabase.from("product_images").insert({
    product_id: productId, external_url: link, alt_text: alt, sort_order: sortOrder, is_primary: !hasPrimary,
  });
  if (error) return { error: error.code === "42501" ? NO_PERMISSION : "The image could not be saved. Please try again." };
  await afterChange(productId, "image added");
  return {};
}

export async function updateImageAlt(productId: string, imageId: string, altText: string): Promise<ActionResult> {
  const { error: roleError } = await requireEditor();
  if (roleError) return { error: roleError };
  const alt = altText.trim();
  if (!alt) return { error: "Alt text cannot be empty." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("product_images").update({ alt_text: alt }).eq("id", imageId).eq("product_id", productId).select("id");
  if (error || !data?.length) return { error: "The alt text could not be saved." };
  await afterChange(productId, "image alt text changed");
  return {};
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<ActionResult> {
  const { error: roleError } = await requireEditor();
  if (roleError) return { error: roleError };
  const supabase = await createClient();
  const { error: clearError } = await supabase.from("product_images").update({ is_primary: false }).eq("product_id", productId).eq("is_primary", true);
  if (clearError) return { error: "The main image could not be changed." };
  const { data, error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", imageId).eq("product_id", productId).select("id");
  if (error || !data?.length) return { error: "The main image could not be changed." };
  await afterChange(productId, "main image changed");
  return {};
}

export async function moveImage(productId: string, imageId: string, direction: "up" | "down"): Promise<ActionResult> {
  const { error: roleError } = await requireEditor();
  if (roleError) return { error: roleError };
  const supabase = await createClient();
  const { data } = await supabase.from("product_images").select("id").eq("product_id", productId).order("sort_order").order("created_at");
  const ids = (data ?? []).map((r) => r.id as string);
  const from = ids.indexOf(imageId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return {};
  [ids[from], ids[to]] = [ids[to], ids[from]];
  for (const [index, id] of ids.entries()) {
    const { error } = await supabase.from("product_images").update({ sort_order: (index + 1) * 10 }).eq("id", id);
    if (error) return { error: "The order could not be saved." };
  }
  await afterChange(productId, "images reordered");
  return {};
}

export async function removeImage(productId: string, imageId: string): Promise<ActionResult> {
  const { error: roleError } = await requireEditor();
  if (roleError) return { error: roleError };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("storage_path, is_primary");
  if (error || !data?.length) return { error: "The image could not be removed." };
  const removed = data[0];
  if (removed.storage_path) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([removed.storage_path as string]);
  if (removed.is_primary) {
    // Keep a main image: promote the first remaining one.
    const { data: first } = await supabase.from("product_images").select("id").eq("product_id", productId).order("sort_order").limit(1);
    if (first?.[0]) await supabase.from("product_images").update({ is_primary: true }).eq("id", first[0].id);
  }
  await afterChange(productId, "image removed");
  return {};
}
