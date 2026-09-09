import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Diamond,
  Package,
  BarChart3,
  X,
  Save,
  Loader2,
  AlertTriangle,
  Mail,
  Upload,
} from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";

type ProductId = Id<"products">;
type StorageId = Id<"_storage">;

const CUTS = ["Ideal", "Excellent", "Very Good", "Good"] as const;
const COLORS = ["D", "E", "F", "G", "H", "I"] as const;
const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"] as const;
const CATEGORIES = ["Rings", "Earrings", "Pendants", "Bracelets"];
const METAL_OPTIONS_DEFAULT = [
  { metalType: "14k Gold", priceAdjustment: 0 },
  { metalType: "18k Gold", priceAdjustment: 800 },
  { metalType: "10k Gold", priceAdjustment: -400 },
  { metalType: "Gold-Plated Silver", priceAdjustment: -2000 },
];

interface ProductForm {
  name: string;
  description: string;
  basePrice: number;
  stock: number;
  metalType: string;
  size: string;
  carat: number;
  cut: string;
  color: string;
  clarity: string;
  imageUrl: string;
  images: string[];
  imageStorageId?: StorageId;
  metalOptions: { metalType: string; priceAdjustment: number }[];
  certificateUrl: string;
  category: string;
  featured: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  basePrice: 0,
  stock: 0,
  metalType: "14k Gold",
  size: "7",
  carat: 1.0,
  cut: "Ideal",
  color: "F",
  clarity: "VS1",
  imageUrl: "",
  images: [""],
  metalOptions: [...METAL_OPTIONS_DEFAULT],
  certificateUrl: "",
  category: "Rings",
  featured: false,
};

function ProductFormModal({
  initial,
  onSave,
  onClose,
  generateUploadUrl,
}: {
  initial: ProductForm;
  onSave: (form: ProductForm) => void;
  onClose: () => void;
  generateUploadUrl: () => Promise<string>;
}) {
  const [form, setForm] = useState<ProductForm>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof ProductForm>(key: K, val: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const addImage = () => setForm((f) => ({ ...f, images: [...f.images, ""] }));
  const removeImage = (idx: number) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  const updateImage = (idx: number, val: string) =>
    setForm((f) => ({
      ...f,
      images: f.images.map((img, i) => (i === idx ? val : img)),
    }));

  const addMetal = () =>
    setForm((f) => ({
      ...f,
      metalOptions: [...f.metalOptions, { metalType: "", priceAdjustment: 0 }],
    }));
  const removeMetal = (idx: number) =>
    setForm((f) => ({
      ...f,
      metalOptions: f.metalOptions.filter((_, i) => i !== idx),
    }));
  const updateMetal = (
    idx: number,
    key: "metalType" | "priceAdjustment",
    val: string | number,
  ) =>
    setForm((f) => ({
      ...f,
      metalOptions: f.metalOptions.map((m, i) =>
        i === idx ? { ...m, [key]: val } : m,
      ),
    }));

  /** Upload a selected file to Convex storage and attach its storageId. */
  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file (PNG, JPG, WEBP).");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      // 1. Ask the backend for a short-lived upload URL
      const uploadUrl = await generateUploadUrl();
      // 2. POST the file directly to Convex storage
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status} ${res.statusText})`);
      }
      // 3. Extract the storageId from the response
      const { storageId } = (await res.json()) as { storageId: string };
      setForm((f) => ({
        ...f,
        imageStorageId: storageId as StorageId,
        // Show the freshly-uploaded image immediately via a local preview
        imageUrl: URL.createObjectURL(file),
      }));
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Image upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const cleaned = {
      ...form,
      images: form.images.filter((img) => img.trim() !== ""),
      metalOptions: form.metalOptions.filter((m) => m.metalType.trim() !== ""),
      imageUrl: form.imageUrl || form.images[0] || "",
    };
    await onSave(cleaned);
    setSaving(false);
  };

  const inputClass =
    "w-full rounded-lg border border-[#E5E2DD] bg-white px-3 py-2.5 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50 transition-colors";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wider text-[#1A202C]/40 block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1A202C]/20 backdrop-blur-sm p-4 pt-8 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-2xl border border-[#E5E2DD] bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[#E5E2DD] px-6 py-4">
          <h2 className="text-lg font-light tracking-tight text-[#1A202C]">
            {initial.name === "" ? "Add New Product" : "Edit Product"}
          </h2>
          <button onClick={onClose} className="text-[#1A202C]/30 hover:text-[#1A202C]/60 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Product Name</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. The Solitaire Crown Ring"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className={labelClass}>Base Price ($)</label>
              <input
                type="number"
                value={form.basePrice}
                onChange={(e) => update("basePrice", Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => update("stock", Number(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Default Metal</label>
              <input
                value={form.metalType}
                onChange={(e) => update("metalType", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Diamond 4Cs */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1A202C]/30 mb-3">
              Diamond 4Cs
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Carat</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.carat}
                  onChange={(e) => update("carat", Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cut</label>
                <select
                  value={form.cut}
                  onChange={(e) => update("cut", e.target.value)}
                  className={inputClass}
                >
                  {CUTS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Color</label>
                <select
                  value={form.color}
                  onChange={(e) => update("color", e.target.value)}
                  className={inputClass}
                >
                  {COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Clarity</label>
                <select
                  value={form.clarity}
                  onChange={(e) => update("clarity", e.target.value)}
                  className={inputClass}
                >
                  {CLARITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Size */}
          <div>
            <label className={labelClass}>Size</label>
            <input
              value={form.size}
              onChange={(e) => update("size", e.target.value)}
              placeholder="e.g. 7, One Size, 7 inches"
              className={inputClass}
            />
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Product Images</label>
              <button
                type="button"
                onClick={addImage}
                className="text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
              >
                + Add Image
              </button>
            </div>

            {/* Upload primary image to Convex storage */}
            <div className="mb-4 rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#1A202C]/50">
                    Upload Primary Image
                  </p>
                  <p className="text-[11px] text-[#1A202C]/35 mt-0.5">
                    Stored in Convex file storage · PNG, JPG, WEBP
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-white px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/8 transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {uploading ? "Uploading…" : "Choose File"}
                </button>
              </div>
              {uploadError && (
                <p className="mt-2 text-xs text-red-500">{uploadError}</p>
              )}
              {form.imageStorageId && form.imageUrl && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={form.imageUrl}
                    alt="Primary image preview"
                    className="h-14 w-14 rounded-lg border border-[#E5E2DD] object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-emerald-600">
                      Image uploaded to storage
                    </p>
                    <p className="text-[10px] text-[#1A202C]/30 truncate">
                      Storage ID: {form.imageStorageId}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, imageStorageId: undefined, imageUrl: "" }))
                    }
                    className="shrink-0 p-1.5 text-[#1A202C]/25 hover:text-red-400 transition-colors"
                    aria-label="Remove uploaded image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {form.images.map((img, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={img}
                    onChange={(e) => updateImage(i, e.target.value)}
                    placeholder={`Image URL ${i + 1}`}
                    className={inputClass}
                  />
                  {form.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="shrink-0 px-2 text-[#1A202C]/20 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metal Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Metal Variants & Pricing</label>
              <button
                type="button"
                onClick={addMetal}
                className="text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
              >
                + Add Metal
              </button>
            </div>
            <div className="space-y-2">
              {form.metalOptions.map((mv, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={mv.metalType}
                    onChange={(e) => updateMetal(i, "metalType", e.target.value)}
                    placeholder="Metal name"
                    className={`${inputClass} flex-1`}
                  />
                  <div className="relative w-36">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#1A202C]/30">
                      +$
                    </span>
                    <input
                      type="number"
                      value={mv.priceAdjustment}
                      onChange={(e) =>
                        updateMetal(i, "priceAdjustment", Number(e.target.value))
                      }
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMetal(i)}
                    className="shrink-0 px-2 text-[#1A202C]/20 hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Certificate URL</label>
              <input
                value={form.certificateUrl}
                onChange={(e) => update("certificateUrl", e.target.value)}
                placeholder="https://www.igi.org/viewpdf/..."
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                    form.featured
                      ? "bg-[#D4AF37] border-[#D4AF37]"
                      : "border-[#1A202C]/20"
                  }`}
                  onClick={() => update("featured", !form.featured)}
                >
                  {form.featured && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[#1A202C]/60">Featured on homepage</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E5E2DD] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#E5E2DD] bg-white px-5 py-2.5 text-sm font-medium text-[#1A202C]/60 hover:bg-[#F0EDE8] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D4AF37]/90 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {initial.name === "" ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Admin() {
  const products = useQuery(api.admin.listAllProducts);
  const inquiries = useQuery(api.inquiries.listAll);
  const updateInquiryStatus = useMutation(api.inquiries.updateStatus);
  const createProduct = useMutation(api.admin.createProduct);
  const updateProduct = useMutation(api.admin.updateProduct);
  const deleteProduct = useMutation(api.admin.deleteProduct);
  const generateUploadUrl = useMutation(api.admin.generateUploadUrl);
  const [selectedInquiry, setSelectedInquiry] = useState<Record<string, unknown> | null>(null);
  const [inquiryImageModal, setInquiryImageModal] = useState<string | null>(null);

  const [modal, setModal] = useState<
    | { mode: "add" }
    | { mode: "edit"; form: ProductForm; id: Id<"products"> }
    | null
  >(null);
  const [deleting, setDeleting] = useState<Id<"products"> | null>(null);
  const [inquiryFilter, setInquiryFilter] = useState<"all" | "new" | "reviewed" | "responded">("all");

  const toForm = (p: Record<string, unknown>): ProductForm => ({
    name: (p.name as string) ?? "",
    description: (p.description as string) ?? "",
    basePrice: (p.basePrice as number) ?? 0,
    stock: (p.stock as number) ?? 0,
    metalType: (p.metalType as string) ?? "14k Gold",
    size: (p.size as string) ?? "7",
    carat: (p.carat as number) ?? 1,
    cut: (p.cut as string) ?? "Ideal",
    color: (p.color as string) ?? "F",
    clarity: (p.clarity as string) ?? "VS1",
    imageUrl: (p.imageUrl as string) ?? "",
    images: (p.images as string[]) ?? [""],
    metalOptions:
      (p.metalOptions as { metalType: string; priceAdjustment: number }[]) ??
      [...METAL_OPTIONS_DEFAULT],
    certificateUrl: (p.certificateUrl as string) ?? "",
    category: (p.category as string) ?? "Rings",
    featured: (p.featured as boolean) ?? false,
  });

  const handleSave = async (form: ProductForm) => {
    const payload = {
      ...form,
      cut: form.cut as "Ideal" | "Excellent" | "Very Good" | "Good",
      color: form.color as "D" | "E" | "F" | "G" | "H" | "I",
      clarity: form.clarity as
        | "FL"
        | "IF"
        | "VVS1"
        | "VVS2"
        | "VS1"
        | "VS2"
        | "SI1"
        | "SI2",
    };
    if (modal?.mode === "add") {
      await createProduct(payload);
    } else if (modal?.mode === "edit") {
      await updateProduct({ id: modal.id, ...payload });
    }
    setModal(null);
  };

  const handleDelete = async (id: Id<"products">) => {
    setDeleting(id);
    try {
      await deleteProduct({ id });
    } finally {
      setDeleting(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);

  // Stats
  const totalProducts = products?.length ?? 0;
  const totalStock = products?.reduce((sum, p) => sum + p.stock, 0) ?? 0;
  const featuredCount = products?.filter((p) => p.featured).length ?? 0;
  const categories = products
    ? Array.from(new Set(products.map((p) => p.category)))
    : [];

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A202C]">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="text-3xl font-light tracking-tight text-[#1A202C]">
              Admin Portal
            </h1>
            <p className="mt-1 text-sm text-[#1A202C]/40">
              Manage inventory, pricing, and product catalog
            </p>
          </div>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 transition-all self-start"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10"
        >
          {[
            { icon: Package, label: "Products", value: totalProducts },
            { icon: Diamond, label: "Total Stock", value: totalStock },
            { icon: BarChart3, label: "Categories", value: categories.length },
            {
              icon: Mail,
              label: "Inquiries",
              value: inquiries?.length ?? 0,
              accent: (inquiries?.filter((i) => i.status === "new").length ?? 0) > 0,
              badge: inquiries?.filter((i) => i.status === "new").length,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#E5E2DD] bg-white p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.accent ? "text-[#D4AF37]" : "text-[#1A202C]/20"}`} />
                <span className="text-[11px] uppercase tracking-wider text-[#1A202C]/30">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-light text-[#1A202C]">{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Products Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[#E5E2DD] bg-white overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#E5E2DD]">
            <h2 className="text-sm font-medium text-[#1A202C]">
              Product Inventory
            </h2>
          </div>

          {products === undefined ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]/30 mx-auto" />
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-[#1A202C]/30">
              <Diamond className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No products yet. Add your first product.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E2DD]/50">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/30">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/30 hidden sm:table-cell">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/30 hidden md:table-cell">
                      4Cs
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/30">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/30 hidden sm:table-cell">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#1A202C]/30">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product._id}
                      className="border-b border-[#E5E2DD]/30 last:border-0 hover:bg-[#F9F8F6]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-[#F0EDE8] overflow-hidden shrink-0">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1A202C] truncate max-w-[200px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-[#1A202C]/30">
                              {product.metalType}
                              {product.featured && (
                                <span className="ml-1.5 text-[#D4AF37]">
                                  ★ Featured
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span className="inline-flex rounded-full bg-[#F0EDE8] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-[#1A202C]/50">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <p className="text-xs text-[#1A202C]/40">
                          {product.carat}ct · {product.cut} · {product.color} · {product.clarity}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-sm font-medium text-[#D4AF37]">
                          {formatPrice(product.basePrice)}
                        </p>
                        <p className="text-[10px] text-[#1A202C]/25">
                          {product.metalOptions?.length ?? 0} metals
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 text-sm ${
                            product.stock <= 5
                              ? "text-amber-500"
                              : "text-[#1A202C]/50"
                          }`}
                        >
                          {product.stock <= 5 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          )}
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() =>
                              setModal({ mode: "edit", form: toForm(product), id: product._id })
                            }
                            className="p-1.5 rounded-lg text-[#1A202C]/30 hover:text-[#D4AF37] hover:bg-[#D4AF37]/8 transition-all"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            disabled={deleting === product._id}
                            className="p-1.5 rounded-lg text-[#1A202C]/30 hover:text-red-400 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            {deleting === product._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Custom Design Inquiries */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-6 rounded-2xl border border-[#E5E2DD] bg-white overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#E5E2DD]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-[#1A202C]">Custom Design Inquiries</h2>
                {inquiries && inquiries.filter((i) => i.status === "new").length > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D4AF37] px-1.5 text-[10px] font-bold text-white">
                    {inquiries.filter((i) => i.status === "new").length}
                  </span>
                )}
              </div>
              {inquiries && (
                <span className="text-xs text-[#1A202C]/30">{inquiries.length} total</span>
              )}
            </div>
            {inquiries && inquiries.length > 0 && (
              <div className="flex gap-1">
                {([
                  { key: "all" as const, label: "All" },
                  { key: "new" as const, label: "New" },
                  { key: "reviewed" as const, label: "Reviewed" },
                  { key: "responded" as const, label: "Responded" },
                ]).map((tab) => {
                  const count = tab.key === "all"
                    ? inquiries.length
                    : inquiries.filter((i) => i.status === tab.key).length;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setInquiryFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        inquiryFilter === tab.key
                          ? "bg-[#1A202C] text-white"
                          : "text-[#1A202C]/40 hover:text-[#1A202C]/60 hover:bg-[#F0EDE8]"
                      }`}
                    >
                      {tab.label}
                      <span className="ml-1 text-[10px] opacity-60">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {!inquiries ? (
            <div className="p-12 text-center text-sm text-[#1A202C]/30">Loading...</div>
          ) : inquiries.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#1A202C]/30">No inquiries yet.</div>
          ) : (
            <div className="divide-y divide-[#E5E2DD]">
              {inquiries
                .filter((inq) => inquiryFilter === "all" || inq.status === inquiryFilter)
                .map((inq) => (
                <div
                  key={inq._id}
                  className="px-6 py-4 hover:bg-[#F9F8F6]/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedInquiry(selectedInquiry?._id === inq._id ? null : inq as Record<string, unknown>)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                        <Mail className="h-3.5 w-3.5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A202C]">{inq.firstName} {inq.lastName}</p>
                        <p className="text-xs text-[#1A202C]/35">{inq.email} · {inq.jewelryType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        inq.status === "new" ? "bg-[#D4AF37]/10 text-[#D4AF37]" :
                        inq.status === "reviewed" ? "bg-[#1A202C]/5 text-[#1A202C]/50" :
                        "bg-emerald-50 text-emerald-600"
                      }`}>{inq.status}</span>
                    </div>
                  </div>
                  {/* Expanded details */}
                  {selectedInquiry?._id === inq._id && (
                    <>
                      <div className="mt-4 pt-4 border-t border-[#E5E2DD] space-y-3">
                        {inq.phone && <p className="text-xs text-[#1A202C]/40">Phone: {inq.phone}</p>}
                        {inq.metal && <p className="text-xs text-[#1A202C]/40">Metal: {inq.metal}</p>}
                        {inq.description && <p className="text-xs text-[#1A202C]/50 leading-relaxed">{inq.description}</p>}
                        {inq.images && inq.images.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1A202C]/30 mb-2">Reference Photos</p>
                            <div className="flex flex-wrap gap-2">
                              {inq.images.map((img: string, i: number) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setInquiryImageModal(img); }}
                                  className="h-16 w-16 rounded-lg overflow-hidden border border-[#E5E2DD] hover:border-[#D4AF37]/30 transition-colors"
                                >
                                  <img
                                    src={img}
                                    alt="Reference"
                                    loading="lazy"
                                    decoding="async"
                                    width={64}
                                    height={64}
                                    className="h-full w-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                      {(["new", "reviewed", "responded"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateInquiryStatus({ inquiryId: inq._id, status: s }); }}
                          disabled={inq.status === s}
                          className={`text-[10px] px-3 py-1 rounded-full border transition-all ${
                            inq.status === s ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]" : "border-[#E5E2DD] text-[#1A202C]/30 hover:border-[#1A202C]/20"
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                    </>
                  )}
                </div>
              ))
            }
            </div>
          )}
        </motion.div>

        {/* Inquiry image lightbox */}
        {inquiryImageModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4" onClick={() => setInquiryImageModal(null)}>
            <button type="button" onClick={() => setInquiryImageModal(null)} className="absolute top-6 right-6 text-white/60 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            <img src={inquiryImageModal} alt="Reference" className="max-h-[85vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          </div>
        )}

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.03] px-5 py-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-4 w-4 text-[#D4AF37]/60 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-[#1A202C]/50">
              <strong className="text-[#1A202C]/70">Admin access:</strong>{" "}
              Only users with the "admin" role can access this portal. Admin
              access is granted via the "Request Admin Access" flow on the
              sign-in page, which verifies a code sent to the company email —
              or automatically for whitelisted admin addresses.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="mt-16">
        <Footer />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <ProductFormModal
            initial={modal.mode === "add" ? emptyForm : modal.form}
            onSave={handleSave}
            onClose={() => setModal(null)}
            generateUploadUrl={generateUploadUrl}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
