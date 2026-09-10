import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery, useMutation, useAction } from "convex/react";
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
  Sparkles,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Id } from "../convex/_generated/dataModel";

type ProductId = Id<"products">;
type StorageId = Id<"_storage">;

const CUTS = ["Ideal", "Excellent", "Very Good", "Good"] as const;
const COLORS = ["D", "E", "F", "G", "H", "I"] as const;
const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2"] as const;
const CATEGORIES = ["Rings", "Earrings", "Pendants", "Bracelets"];

const METAL_CATEGORIES = ["Gold", "Silver", "Platinum"] as const;
type MetalCategory = (typeof METAL_CATEGORIES)[number];

const METAL_VARIANTS: Record<MetalCategory, string[]> = {
  Gold: ["18K Gold", "14K Gold", "10K Gold"],
  Silver: ["925 Silver"],
  Platinum: ["Platinum"],
};

const GOLD_COLORS = ["Yellow", "Rose", "White"] as const;

type MetalOption = { metalType: string; price: number; color?: string };

function buildMetalOptions(category: MetalCategory): MetalOption[] {
  if (category === "Gold") {
    const variants: MetalOption[] = [];
    for (const karat of METAL_VARIANTS.Gold) {
      for (const color of GOLD_COLORS) {
        variants.push({ metalType: `${karat} - ${color}`, price: 0, color });
      }
    }
    return variants;
  }
  return METAL_VARIANTS[category].map((m) => ({ metalType: m, price: 0 }));
}

function detectMetalCategory(metalOptions: MetalOption[]): MetalCategory {
  const names = metalOptions.map((m) => m.metalType.toLowerCase());
  if (names.some((n) => n.includes("silver"))) return "Silver";
  if (names.some((n) => n.includes("platinum"))) return "Platinum";
  return "Gold";
}

interface ProductForm {
  name: string;
  description: string;
  basePrice: number;
  stock: number;
  metalType: string;
  metalCategory: MetalCategory;
  size: string;
  sizeType: "Ring Size" | "Inches" | "One Size" | "Custom";
  carat: number;
  diamondType: "Moissanite" | "CVD" | "Natural Diamond" | "";
  weightGrams?: number;
  settingType: string;
  cut: string;
  color: string;
  clarity: string;
  imageUrl: string;
  images: string[];
  imageStorageId?: StorageId;
  imageStorageIds?: StorageId[];
  metalOptions: MetalOption[];
  certificateUrl: string;
  certificateType: "GIA" | "IGI" | "";
  certificateNumber: string;
  category: string;
  featured: boolean;
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  basePrice: 0,
  stock: 0,
  metalType: "14K Gold - Yellow",
  metalCategory: "Gold",
  size: "4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9",
  sizeType: "Ring Size",
  carat: 1.0,
  diamondType: "CVD",
  weightGrams: undefined,
  settingType: "",
  cut: "Ideal",
  color: "F",
  clarity: "VS1",
  imageUrl: "",
  images: [""],
  metalOptions: buildMetalOptions("Gold"),
  certificateUrl: "",
  certificateType: "",
  certificateNumber: "",
  category: "Rings",
  featured: false,
};

function ProductFormModal({
  initial,
  onSave,
  onClose,
  generateUploadUrl,
  analyzeProductImage,
}: {
  initial: ProductForm;
  onSave: (form: Omit<ProductForm, "metalCategory">) => void;
  onClose: () => void;
  generateUploadUrl: () => Promise<string>;
  analyzeProductImage: (args: { imageDataUrl: string; category: string }) => Promise<{ name: string; description: string }>;
}) {
  const [form, setForm] = useState<ProductForm>({ ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadedPreviews, setUploadedPreviews] = useState<string[]>(() => {
    const existing = initial.images.filter((img) => img.trim() !== "");
    if (existing.length > 0) return existing;
    if (initial.imageUrl) return [initial.imageUrl];
    return [];
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [metalPriceCache, setMetalPriceCache] = useState<Record<string, number>>(() => {
    const cache: Record<string, number> = {};
    for (const opt of initial.metalOptions) {
      if (opt.price) cache[opt.metalType] = opt.price;
    }
    return cache;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof ProductForm>(key: K, val: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const moveUploadedImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= uploadedPreviews.length) return;
    setUploadedPreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setForm((f) => {
      const ids = [...(f.imageStorageIds ?? [])];
      if (ids.length > 1) {
        const [movedId] = ids.splice(fromIndex, 1);
        ids.splice(toIndex, 0, movedId);
      }
      return {
        ...f,
        imageStorageIds: ids.length > 0 ? ids : f.imageStorageIds,
      };
    });
    setSelectedImage((prev) => (prev ? prev : null));
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    moveUploadedImage(dragIndex, index);
    setDragIndex(index);
  };

  const handleDragEnd = () => setDragIndex(null);

  const removeUploadedImage = (index: number) => {
    setUploadedPreviews((prev) => prev.filter((_, i) => i !== index));
    setForm((f) => {
      const ids = [...(f.imageStorageIds ?? [])];
      ids.splice(index, 1);
      return {
        ...f,
        imageStorageIds: ids.length > 0 ? ids : undefined,
        imageStorageId: index === 0 ? ids[0] : f.imageStorageId,
      };
    });
  };

  const handleCategoryChange = (category: string) =>
    setForm((f) => {
      if (category === "Earrings" || category === "Pendants") {
        return { ...f, category, size: "One Size", sizeType: "One Size" };
      }
      if (category === "Rings") {
        return { ...f, category, size: "4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9", sizeType: "Ring Size" };
      }
      if (category === "Bracelets") {
        return { ...f, category, size: "6.5,7,7.5,8,8.5", sizeType: "Inches" };
      }
      return { ...f, category };
    });

  const handleMetalCategoryChange = (category: MetalCategory) => {
    setForm((f) => {
      const hasCategory = f.metalOptions.some((opt) =>
        buildMetalOptions(category).some((v) => v.metalType === opt.metalType),
      );
      if (hasCategory) {
        // Remove this category's variants
        const removeTypes = new Set(buildMetalOptions(category).map((v) => v.metalType));
        return {
          ...f,
          metalOptions: f.metalOptions.filter((opt) => !removeTypes.has(opt.metalType)),
        };
      } else {
        // Add this category's variants with cached prices
        const cache = { ...metalPriceCache };
        for (const opt of f.metalOptions) {
          if (opt.price) cache[opt.metalType] = opt.price;
        }
        setMetalPriceCache(cache);
        const newVariants = buildMetalOptions(category).map((v) => ({
          ...v,
          price: cache[v.metalType] ?? 0,
        }));
        return {
          ...f,
          metalOptions: [...f.metalOptions, ...newVariants],
        };
      }
    });
  };

  const updateMetalPrice = (idx: number, price: number) =>
    setForm((f) => {
      const changed = f.metalOptions[idx];
      const karatPrefix = changed.metalType.split(" - ")[0];
      // Update cache
      const cache = { ...metalPriceCache };
      for (const opt of f.metalOptions) {
        if (opt.metalType.startsWith(karatPrefix)) cache[opt.metalType] = price;
      }
      setMetalPriceCache(cache);
      return {
        ...f,
        metalOptions: f.metalOptions.map((m) =>
          m.metalType.startsWith(karatPrefix) ? { ...m, price } : m,
        ),
      };
    });

  /** Upload selected files to Convex storage and attach their storage IDs. */
  const handleFileSelected = async (fileList: FileList | undefined) => {
    const files = fileList ? Array.from(fileList) : [];
    if (files.length === 0) return;
    setSelectedImage(files[0]);
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setUploadError("Please choose an image file (PNG, JPG, WEBP).");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded: { storageId: StorageId; preview: string }[] = [];
      for (const file of files) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!res.ok) throw new Error(`Upload failed (${res.status} ${res.statusText})`);
        const { storageId } = (await res.json()) as { storageId: string };
        uploaded.push({ storageId: storageId as StorageId, preview: URL.createObjectURL(file) });
      }
      const storageIds = uploaded.map((item) => item.storageId);
      const previews = uploaded.map((item) => item.preview);
      setUploadedPreviews((current) => [...current, ...previews]);
      setForm((f) => ({
        ...f,
        imageStorageId: f.imageStorageId ?? storageIds[0],
        imageStorageIds: [...(f.imageStorageIds ?? []), ...storageIds],
        imageUrl: f.imageUrl || previews[0],
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

  const handleAnalyzeImage = async (file: File | null) => {
    if (!file) {
      setAiError("Choose a product image first.");
      return;
    }
    setAiError(null);
    setAnalyzing(true);
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the image."));
        reader.readAsDataURL(file);
      });
      const copy = await analyzeProductImage({ imageDataUrl, category: form.category });
      setForm((current) => ({ ...current, ...copy }));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const { metalCategory, ...rest } = form;
    const cleaned = {
      ...rest,
      images: [],
      metalOptions: rest.metalOptions
        .filter((m) => m.metalType.trim() !== "")
        .map(({ metalType, price }) => ({ metalType, price })),
      imageUrl: rest.imageUrl || "",
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
          {/* Images */}
          <div>
            <label className={labelClass}>Product Images</label>

            {/* Upload primary image to Convex storage */}
            <div className="mb-4 rounded-xl border border-dashed border-[#D4AF37]/40 bg-[#D4AF37]/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#1A202C]/50">
                    Upload Product Photos
                  </p>
                  <p className="text-[11px] text-[#1A202C]/35 mt-0.5">
                    Stored in Convex file storage · Select multiple PNG, JPG, or WEBP files
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files ?? undefined)}
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
                  {uploading ? "Uploading…" : "Choose Photos"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleAnalyzeImage(selectedImage)}
                disabled={uploading || analyzing}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#1A202C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1A202C]/85 transition-all disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {analyzing ? "Analyzing image…" : "Analyze with AI"}
              </button>
              {uploadError && (
                <p className="mt-2 text-xs text-red-500">{uploadError}</p>
              )}
              {aiError && <p className="mt-2 text-xs text-red-500">{aiError}</p>}
              {(uploadedPreviews.length > 0 || (form.imageStorageId && form.imageUrl)) && (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1A202C]/40 mb-2">
                    Uploaded Images ({uploadedPreviews.length}) — Drag to reorder
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {(uploadedPreviews.length > 0 ? uploadedPreviews : [form.imageUrl]).map((src, index) => (
                      <div
                        key={`${src}-${index}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`relative group rounded-xl border-2 overflow-hidden transition-all ${
                          dragIndex === index
                            ? "border-[#D4AF37] shadow-lg scale-105"
                            : "border-[#E5E2DD] hover:border-[#D4AF37]/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 p-2">
                          <div className="cursor-grab active:cursor-grabbing text-[#1A202C]/20 hover:text-[#1A202C]/50">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <img
                            src={src}
                            alt={`Product preview ${index + 1}`}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 rounded px-1.5 py-0.5 text-center min-w-[20px]">
                              {index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveUploadedImage(index, index - 1)}
                              disabled={index === 0}
                              className="p-0.5 text-[#1A202C]/25 hover:text-[#D4AF37] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              aria-label="Move up"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveUploadedImage(index, index + 1)}
                              disabled={index === uploadedPreviews.length - 1}
                              className="p-0.5 text-[#1A202C]/25 hover:text-[#D4AF37] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              aria-label="Move down"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-white/80 text-[#1A202C]/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

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
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Metal Type</label>
              <select
                value={form.metalCategory}
                onChange={(e) => handleMetalCategoryChange(e.target.value as MetalCategory)}
                className={inputClass}
              >
                {METAL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Diamond Type</label>
              <select
                value={form.diamondType}
                onChange={(e) => update("diamondType", e.target.value as ProductForm["diamondType"])}
                className={inputClass}
              >
                <option value="">Not specified</option>
                <option value="Moissanite">Moissanite</option>
                <option value="CVD">CVD Lab-Grown Diamond</option>
                <option value="Natural Diamond">Natural Diamond</option>
              </select>
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
          {form.category === "Earrings" || form.category === "Pendants" ? (
            <div>
              <label className={labelClass}>Size</label>
              <input
                value="One Size"
                disabled
                className={`${inputClass} bg-[#F9F8F6] cursor-not-allowed`}
              />
              <p className="mt-1 text-[10px] text-[#1A202C]/30">
                {form.category} are One Size
              </p>
            </div>
          ) : (
            <div>
              <label className={labelClass}>
                {form.category === "Rings" ? "Ring Sizes" : "Sizes (Inches)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {(form.category === "Rings"
                  ? ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"]
                  : ["6.5", "7", "7.5", "8", "8.5"]
                ).map((s) => {
                  const selected = form.size.split(",").filter(Boolean).includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const current = form.size.split(",").filter(Boolean);
                        const next = selected
                          ? current.filter((x) => x !== s)
                          : [...current, s];
                        update("size", next.join(","));
                      }}
                      className={`rounded-lg border-2 px-3 py-1.5 text-sm font-medium transition-all ${
                        selected
                          ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]"
                          : "border-[#E5E2DD] text-[#1A202C]/40 hover:border-[#D4AF37]/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-[#1A202C]/30">
                {form.size.split(",").filter(Boolean).length} size(s) selected
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Weight (grams)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.weightGrams ?? ""}
                onChange={(e) => update("weightGrams", e.target.value === "" ? undefined : Number(e.target.value))}
                placeholder="e.g. 3.25"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Setting Type</label>
              <input
                value={form.settingType}
                onChange={(e) => update("settingType", e.target.value)}
                placeholder="e.g. Prong, Bezel, Halo"
                className={inputClass}
              />
            </div>
          </div>

          {/* Metal Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClass}>Metal Variants</label>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold text-[#1A202C]/60 block mb-1.5">Metal Types</label>
              <div className="flex gap-2">
                {METAL_CATEGORIES.map((cat) => {
                  const isActive = form.metalOptions.some((opt) =>
                    buildMetalOptions(cat).some((v) => v.metalType === opt.metalType),
                  );
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleMetalCategoryChange(cat)}
                      className={`flex-1 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]"
                          : "border-[#E5E2DD] bg-white text-[#1A202C]/50 hover:border-[#D4AF37]/30"
                      }`}
                    >
                      {cat === "Gold" && "🥇 "}
                      {cat === "Silver" && "🥈 "}
                      {cat === "Platinum" && "💎 "}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              {form.metalOptions.map((mv, i) => {
                const colorDot =
                  mv.color === "Yellow"
                    ? "bg-yellow-400"
                    : mv.color === "Rose"
                    ? "bg-rose-300"
                    : mv.color === "White"
                    ? "bg-gray-200 border border-gray-300"
                    : null;

                return (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {colorDot && (
                        <span className={`inline-block h-3 w-3 rounded-full shrink-0 ${colorDot}`} />
                      )}
                      <span className="text-sm text-[#1A202C] truncate">{mv.metalType}</span>
                    </div>
                    <div className="relative w-36 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#1A202C]/30">$</span>
                      <input
                        type="number"
                        min="0"
                        value={mv.price}
                        onChange={(e) => updateMetalPrice(i, Number(e.target.value))}
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Certificate & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Certificate Lab</label>
              <select
                value={form.certificateType}
                onChange={(e) => update("certificateType", e.target.value as "GIA" | "IGI" | "")}
                className={inputClass}
              >
                <option value="">No certificate</option>
                <option value="GIA">GIA</option>
                <option value="IGI">IGI</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Certificate Number</label>
              <input
                value={form.certificateNumber}
                onChange={(e) => update("certificateNumber", e.target.value)}
                placeholder="e.g. 123456789"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Certificate URL</label>
              <input
                value={form.certificateUrl}
                onChange={(e) => update("certificateUrl", e.target.value)}
                placeholder="https://www.igi.org/viewpdf/..."
                className={inputClass}
              />
            </div>
            <div className="flex items-end sm:col-span-3">
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
  const backfillSlugs = useMutation(api.admin.backfillSlugs);
  const analyzeProductImage = useAction(api.productAi.analyzeProductImage);
  const [selectedInquiry, setSelectedInquiry] = useState<Record<string, unknown> | null>(null);
  const [inquiryImageModal, setInquiryImageModal] = useState<string | null>(null);

  const [modal, setModal] = useState<
    | { mode: "add" }
    | { mode: "edit"; form: ProductForm; id: Id<"products"> }
    | null
  >(null);
  const [deleting, setDeleting] = useState<Id<"products"> | null>(null);
  const [inquiryFilter, setInquiryFilter] = useState<"all" | "new" | "reviewed" | "responded">("all");

  const toForm = (p: Record<string, unknown>): ProductForm => {
    const rawOptions = (p.metalOptions as { metalType: string; price?: number; priceAdjustment?: number }[]) ?? [];
    const metalOptions: MetalOption[] = rawOptions.map((option) => ({
      metalType: option.metalType,
      price: option.price ?? ((p.basePrice as number) ?? 0) + (option.priceAdjustment ?? 0),
      priceAdjustment: option.priceAdjustment,
    }));
    const metalCategory = detectMetalCategory(metalOptions);
    return {
      name: (p.name as string) ?? "",
      description: (p.description as string) ?? "",
      basePrice: (p.basePrice as number) ?? 0,
      stock: (p.stock as number) ?? 0,
      metalType: (p.metalType as string) ?? "14K Gold - Yellow",
      metalCategory,
      size: (p.size as string) ?? "4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9",
      sizeType: (p.sizeType as ProductForm["sizeType"]) ?? "Custom",
      carat: (p.carat as number) ?? 1,
      diamondType: (p.diamondType as ProductForm["diamondType"]) ?? "",
      weightGrams: (p.weightGrams as number) ?? undefined,
      settingType: (p.settingType as string) ?? "",
      cut: (p.cut as string) ?? "Ideal",
      color: (p.color as string) ?? "F",
      clarity: (p.clarity as string) ?? "VS1",
      imageUrl: (p.imageUrl as string) ?? "",
      images: (p.images as string[]) ?? [""],
      imageStorageIds: (p.imageStorageIds as StorageId[]) ?? undefined,
      metalOptions,
      certificateUrl: (p.certificateUrl as string) ?? "",
      certificateType: (p.certificateType as "GIA" | "IGI") ?? "",
      certificateNumber: (p.certificateNumber as string) ?? "",
      category: (p.category as string) ?? "Rings",
      featured: (p.featured as boolean) ?? false,
    };
  };

  const handleSave = async (form: Omit<ProductForm, "metalCategory">) => {
    const { certificateType, certificateNumber, weightGrams, settingType, diamondType, ...rest } = form;
    const payload = {
      ...rest,
      weightGrams,
      settingType: settingType || undefined,
      diamondType: diamondType || undefined,
      certificateType: certificateType || undefined,
      certificateNumber: certificateNumber || undefined,
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
  const totalStock = products?.reduce((sum: number, p: { stock: number }) => sum + p.stock, 0) ?? 0;
  const featuredCount = products?.filter((p: { featured: boolean }) => p.featured).length ?? 0;
  const categories = products
    ? Array.from(new Set(products.map((p: { category: string }) => p.category)))
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
              accent: (inquiries?.filter((i: { status: string }) => i.status === "new").length ?? 0) > 0,
              badge: inquiries?.filter((i: { status: string }) => i.status === "new").length,
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
          <div className="px-6 py-4 border-b border-[#E5E2DD] flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#1A202C]">
              Product Inventory
            </h2>
            <button
              onClick={async () => {
                const count = await backfillSlugs();
                alert(`Backfilled ${count} product slugs`);
              }}
              className="text-[11px] text-[#D4AF37] hover:text-[#D4AF37]/80 underline underline-offset-4 transition-colors"
            >
              Backfill Slugs
            </button>
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
                      Metal
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
                  {products.map((product: { _id: string; name: string; imageUrl: string; stock: number; category: string; featured: boolean; basePrice: number; metalOptions: Array<{ metalType: string; price?: number; priceAdjustment?: number }>; metalType: string; carat: number; cut: string; color: string; clarity: string }) => (
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
                          {product.metalType}
                        </p>
                        <p className="text-[10px] text-[#1A202C]/25">
                          {product.metalOptions?.length ?? 0} variants
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
                              setModal({ mode: "edit", form: toForm(product), id: product._id as Id<"products"> })
                            }
                            className="p-1.5 rounded-lg text-[#1A202C]/30 hover:text-[#D4AF37] hover:bg-[#D4AF37]/8 transition-all"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id as Id<"products">)}
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
                {inquiries && inquiries.filter((i: { status: string }) => i.status === "new").length > 0 && (
                  <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D4AF37] px-1.5 text-[10px] font-bold text-white">
                    {inquiries.filter((i: { status: string }) => i.status === "new").length}
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
                    : inquiries.filter((i: { status: string }) => i.status === tab.key).length;
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
                .filter((inq: { status: string; firstName: string; lastName: string; email: string; jewelryType: string; _id: string }) => inquiryFilter === "all" || inq.status === inquiryFilter)
                .map((inq: { status: string; firstName: string; lastName: string; email: string; jewelryType: string; _id: string; phone?: string; metal?: string; description?: string; images?: string[] }) => (
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
                          onClick={(e) => { e.stopPropagation(); updateInquiryStatus({ inquiryId: inq._id as Id<"inquiries">, status: s }); }}
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
            analyzeProductImage={analyzeProductImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
