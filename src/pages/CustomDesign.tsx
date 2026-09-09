import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Diamond, ArrowRight, Check, Loader2, Upload, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export default function CustomDesign() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitInquiry = useMutation(api.inquiries.submit);

  const handleImageAdd = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages: { file: File; preview: string }[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024) {
        newImages.push({ file, preview: URL.createObjectURL(file) });
      }
    }
    setImages((prev) => [...prev, ...newImages].slice(0, 5));
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImageRemove = useCallback((index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);

      // Convert images to base64 data URLs for storage
      const imageDataUrls: string[] = [];
      for (const img of images) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(img.file);
        });
        imageDataUrls.push(dataUrl);
      }

      await submitInquiry({
        firstName: fd.get("firstName") as string,
        lastName: fd.get("lastName") as string,
        email: fd.get("email") as string,
        phone: (fd.get("phone") as string) || undefined,
        jewelryType: fd.get("jewelryType") as string,
        metal: (fd.get("metal") as string) || undefined,
        description: (fd.get("description") as string) || undefined,
        images: imageDataUrls.length > 0 ? imageDataUrls : undefined,
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl bg-white border border-[#E5E2DD] px-4 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50 transition-colors";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wider text-[#1A202C]/40 block mb-2";

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A202C]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A202C] via-[#1A202C]/95 to-[#1A202C]/80" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#D4AF37]/[0.06] blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 sm:pt-32 sm:pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-1.5 mb-6">
              <Diamond className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-xs font-medium text-[#D4AF37] tracking-wide">
                Bespoke Service
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1]">
              <span className="text-white">Design Your</span>
              <br />
              <span className="text-[#D4AF37]">Dream Diamond</span>
            </h1>
            <p className="mt-6 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              Work with our master jewellers to create a one-of-a-kind piece.
              From selecting the perfect lab-grown diamond to choosing your
              preferred metal and setting style.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <Check className="h-8 w-8 text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-light tracking-tight text-[#1A202C]">
                Thank You
              </h2>
              <p className="mt-3 text-base text-[#1A202C]/50 max-w-md mx-auto">
                Your custom design inquiry has been received. Our team will
                reach out within 24 hours to begin crafting your vision.
              </p>
              <a
                href="/"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors"
              >
                Return Home
                <ArrowRight className="h-4 w-4" />
              </a>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1A202C]">
                  Custom Design Inquiry
                </h2>
                <p className="mt-3 text-sm text-[#1A202C]/40 max-w-md mx-auto">
                  Tell us about your vision and we'll bring it to life with
                  ethically crafted lab-grown diamonds.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input
                      name="firstName"
                      type="text"
                      required
                      className={inputClass}
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input
                      name="lastName"
                      type="text"
                      required
                      className={inputClass}
                      placeholder="Your last name"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className={inputClass}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className={labelClass}>Phone (Optional)</label>
                  <input
                    name="phone"
                    type="tel"
                    className={inputClass}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                {/* Jewelry Type — fixed dropdown */}
                <div className="relative">
                  <label className={labelClass}>Jewelry Type</label>
                  <div className="relative">
                    <select
                      name="jewelryType"
                      required
                      className={`${inputClass} appearance-none pr-10`}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select a type
                      </option>
                      <option value="engagement-ring">Engagement Ring</option>
                      <option value="wedding-band">Wedding Band</option>
                      <option value="pendant">Pendant Necklace</option>
                      <option value="earrings">Earrings</option>
                      <option value="bracelet">Bracelet</option>
                      <option value="other">Other</option>
                    </select>
                    {/* Custom chevron icon */}
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="h-4 w-4 text-[#1A202C]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Preferred Metal */}
                <div>
                  <label className={labelClass}>Preferred Metal</label>
                  <div className="flex flex-wrap gap-3">
                    {["18k Gold", "14k Gold", "10k Gold", "Gold-Plated Silver", "Not Sure"].map(
                      (metal) => (
                        <label
                          key={metal}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E2DD] bg-white px-4 py-2.5 text-sm text-[#1A202C]/60 hover:border-[#D4AF37]/30 hover:text-[#1A202C] transition-all cursor-pointer has-[:checked]:border-[#D4AF37] has-[:checked]:bg-[#D4AF37]/5 has-[:checked]:text-[#D4AF37]"
                        >
                          <input type="radio" name="metal" value={metal} className="sr-only" />
                          {metal}
                        </label>
                      )
                    )}
                  </div>
                </div>

                {/* Inspiration Images Upload */}
                <div>
                  <label className={labelClass}>
                    Inspiration Photos (Optional)
                  </label>
                  <p className="text-xs text-[#1A202C]/30 mb-3">
                    Upload reference images to help us understand your vision. Max 5 images, 10MB each.
                  </p>

                  {/* Image previews */}
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {images.map((img, i) => (
                        <div
                          key={i}
                          className="relative group h-24 w-24 rounded-xl overflow-hidden border border-[#E5E2DD] bg-white"
                        >
                          <img
                            src={img.preview}
                            alt={`Reference ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleImageRemove(i)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-[#1A202C]/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {images.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 rounded-xl border-2 border-dashed border-[#E5E2DD] bg-white px-6 py-4 text-sm text-[#1A202C]/40 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]/60 transition-all w-full justify-center"
                    >
                      <Upload className="h-5 w-5" />
                      <span>Click to upload reference images</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImageAdd}
                    className="hidden"
                  />
                </div>

                {/* Vision Description */}
                <div>
                  <label className={labelClass}>Describe Your Vision</label>
                  <textarea
                    name="description"
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Tell us about your dream piece — style, stone size, budget range, or any inspiration..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[#1A202C] py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1A202C]/20 hover:shadow-[#1A202C]/30 hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Submit Inquiry
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-[#1A202C]/30 text-center">
                  Our design consultants typically respond within 24 hours.
                  No commitment required.
                </p>
              </form>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
