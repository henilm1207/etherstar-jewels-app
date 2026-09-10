import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { SafeImage } from "@/components/SafeImage";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  Diamond,
  Shield,
  Sparkles,
  Award,
  ArrowRight,
  Leaf,
} from "lucide-react";

export default function Landing() {
  const featured = useQuery(api.products.featured);
  const allProducts = useQuery(api.products.list, {});
  const homepageProducts = featured?.length ? featured : allProducts;

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A202C]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Navy-to-cream gradient with gold accent glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A202C] via-[#1A202C]/95 to-[#1A202C]/80" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#D4AF37]/[0.06] blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#D4AF37]/[0.04] blur-[120px]" />

        {/* Editorial diamond imagery overlay - blur placeholder */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg viewBox="0 0 1600 900" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="blur-hero-bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F0EDE8" />
                <stop offset="50%" stopColor="#F0EDE8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#blur-hero-bg)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pt-32 sm:pb-40">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-4 py-1.5 mb-8">
                <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span className="text-xs font-medium text-[#D4AF37] tracking-wide">
                  Lab-Grown Diamond Collection
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight leading-[1.1]">
                <span className="text-white">Brilliance</span>
                <br />
                <span className="text-[#D4AF37]">
                  Without Compromise
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-xl leading-relaxed">
                Exquisite lab-grown diamonds that rival nature's finest. Ethically
                crafted, scientifically perfected, and certified by IGI for
                unmatched quality.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
                <Link
                  to="/shop"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#1A202C] shadow-lg shadow-black/20 hover:shadow-black/30 hover:scale-[1.02] transition-all duration-300"
                >
                  Explore Collection
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/shop?category=Rings"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all duration-300 backdrop-blur-sm"
                >
                  View Engagement Rings
                </Link>
              </div>
            </motion.div>

            {/* Editorial imagery side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="aspect-[3/4] rounded-3xl overflow-hidden">
                  <SafeImage src="/assets/hero-jewelry.jpg" alt="Fine jewelry collection" className="h-full w-full object-cover" />
                </div>
                {/* Floating accent card */}
                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                      <Diamond className="h-5 w-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#1A202C]">IGI Certified</p>
                      <p className="text-[11px] text-[#1A202C]/40">Every stone graded</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section id="about" className="border-y border-[#E5E2DD] bg-[#F0EDE8]/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                icon: Diamond,
                title: "Lab-Grown",
                desc: "100% lab-created diamonds",
              },
              {
                icon: Award,
                title: "IGI Certified",
                desc: "Every stone independently graded",
              },
              {
                icon: Shield,
                title: "Lifetime Warranty",
                desc: "Guaranteed quality & craftsmanship",
              },
              {
                icon: Leaf,
                title: "Eco-Friendly",
                desc: "Zero mining, zero conflict",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10">
                  <item.icon className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A202C]">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-[#1A202C]/40">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1A202C]">
              Featured Collection
            </h2>
            <p className="mt-4 text-base text-[#1A202C]/40 max-w-lg mx-auto">
              Hand-selected pieces that showcase the pinnacle of lab-grown
              diamond artistry.
            </p>
          </motion.div>

          {homepageProducts === undefined ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/5] bg-[#F0EDE8] mb-5" />
                  <div className="h-4 bg-[#E5E2DD] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[#E5E2DD] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : homepageProducts.length === 0 ? (
            <div className="text-center py-20 text-[#1A202C]/30">
              <Diamond className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">
                Collection coming soon. Check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {homepageProducts.slice(0, 6).map((product, i: number) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 rounded-full border border-[#1A202C]/10 bg-white px-8 py-3.5 text-sm font-medium text-[#1A202C]/60 hover:bg-[#1A202C]/5 hover:text-[#1A202C] transition-all duration-300"
            >
              View All Jewelry
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* The 4Cs Section */}
      <section id="4cs" className="py-24 sm:py-32 border-t border-[#E5E2DD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1A202C]">
              The 4Cs of Our Diamonds
            </h2>
            <p className="mt-4 text-base text-[#1A202C]/40 max-w-lg mx-auto">
              Every Etherstar diamond is graded on the four key quality
              characteristics recognized worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                letter: "C",
                word: "arat",
                desc: "Measures the diamond's weight and size. Our range spans from 0.5ct to 5.0ct.",
              },
              {
                letter: "C",
                word: "ut",
                desc: "Determines how well the diamond interacts with light. We offer Ideal and Excellent cuts.",
              },
              {
                letter: "C",
                word: "olor",
                desc: "Graded from D (colorless) to I. Our stones range from D to H for exceptional clarity.",
              },
              {
                letter: "C",
                word: "larity",
                desc: "Indicates the presence of inclusions. We feature FL through SI2 grades.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.word}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-[#E5E2DD] p-8 text-center hover:border-[#D4AF37]/30 transition-colors duration-500"
              >
                <div className="text-5xl font-light text-[#D4AF37] leading-none">
                  {item.letter}
                </div>
                <div className="text-xl font-medium text-[#1A202C] mt-1">
                  {item.word}
                </div>
                <p className="mt-4 text-sm text-[#1A202C]/45 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section id="our-story" className="py-24 sm:py-32 border-t border-[#E5E2DD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37] mb-6">
                Our Story
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1A202C] leading-tight">
                Diamonds Born of
                <br />
                <span className="text-[#D4AF37]">Innovation, Not Extraction</span>
              </h2>
              <div className="mt-6 space-y-4 text-[#1A202C]/50 text-base leading-relaxed">
                <p>
                  Etherstar Jewels was founded on a single conviction: luxury should never come at
                  the cost of our planet. We exclusively craft fine jewellery using laboratory-grown
                  diamonds — stones that are chemically, physically, and optically identical to mined
                  diamonds, created in controlled environments that replicate the earth's natural
                  process.
                </p>
                <p>
                  Every Etherstar diamond is independently graded and certified by the International
                  Gemological Institute (IGI), guaranteeing the same rigorous quality standards
                  applied to the world's finest mined stones. Our lab-grown approach eliminates
                  the environmental toll of traditional mining — using significantly less water,
                  producing fewer carbon emissions, and ensuring zero connection to conflict zones.
                </p>
                <p>
                  From engagement rings to tennis bracelets, each piece in our collection is designed
                  to be heirloom-quality, set in your choice of 14k Gold, 18k Gold, or
                  Gold-Plated Silver. We believe the future of fine jewellery is ethical, innovative,
                  and brilliantly transparent.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Editorial imagery grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <SafeImage src="/assets/collection-ring.jpg" alt="Diamond ring detail" className="h-full w-full object-cover" />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden">
                  <SafeImage src="/assets/jewelry-detail.jpg" alt="Gold jewelry detail" className="h-full w-full object-cover" />
                </div>
              </div>
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-4">
              {[
                { stat: "100%", label: "Lab-Grown", desc: "Zero mined diamonds in our supply chain" },
                { stat: "IGI", label: "Certified", desc: "Every stone independently graded" },
                { stat: "70%", label: "Less Carbon", desc: "vs. traditional diamond mining" },
                { stat: "0", label: "Conflict", desc: "Fully traceable, ethical sourcing" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                  className="bg-white rounded-2xl border border-[#E5E2DD] p-6 hover:border-[#D4AF37]/20 transition-colors duration-500"
                >
                  <div className="text-3xl font-light text-[#D4AF37]">
                    {item.stat}
                  </div>
                  <div className="text-sm font-medium text-[#1A202C] mt-1">
                    {item.label}
                  </div>
                  <p className="mt-2 text-xs text-[#1A202C]/35 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lab-Grown Diamonds Explainer */}
      <section id="lab-grown" className="py-24 sm:py-32 border-t border-[#E5E2DD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37] mb-6">
                Lab-Grown Diamonds
              </span>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1A202C] leading-tight">
                Nature's Process,
                <br />
                <span className="text-[#D4AF37]">Perfected in the Lab</span>
              </h2>
              <div className="mt-6 space-y-4 text-[#1A202C]/50 text-base leading-relaxed">
                <p>
                  A lab-grown diamond is not a simulant, a cubic zirconia, or a mere substitute. It is a
                  real diamond — atom for atom identical to one pulled from deep within the earth. The only
                  difference is origin: where a mined diamond takes billions of years and enormous
                  environmental disruption to form, a lab-grown diamond is cultivated in a controlled
                  environment that replicates the earth's natural heat and pressure in a matter of weeks.
                </p>
                <p>
                  Using Chemical Vapour Deposition (CVD) technology, a thin diamond seed is placed in a
                  chamber where carbon-rich gases are energised into plasma. Carbon atoms settle onto the
                  seed, layer by atomic layer, building a crystal that is chemically pure carbon — just like
                  its mined counterpart. The result is a diamond that passes every test a gemologist can
                  perform: the same hardness (10 on the Mohs scale), the same refractive index, the same
                  fire and brilliance.
                </p>
                <p>
                  Each Etherstar diamond is then cut, polished, and graded by master artisans before
                  being independently certified by the International Gemological Institute (IGI). The
                  grading report details the same 4Cs — Carat, Cut, Color, and Clarity — used for mined
                  diamonds, giving you full confidence in the quality of your stone.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden">
                <SafeImage src="/assets/diamond-closeup.jpg" alt="Diamond close-up" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-5 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#1A202C]/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-[#1A202C]" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#1A202C]">100% Real Diamond</p>
                    <p className="text-[11px] text-[#1A202C]/40">Chemically identical to mined</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sustainability Section */}
      <section id="sustainability" className="py-24 sm:py-32 border-t border-[#E5E2DD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37] mb-6">
              Sustainability
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1A202C]">
              Luxury That Leaves
              <br />
              <span className="text-[#D4AF37]">a Lighter Footprint</span>
            </h2>
            <p className="mt-4 text-base text-[#1A202C]/40 max-w-2xl mx-auto leading-relaxed">
              We believe the most beautiful things in the world should not come at the cost of the world itself.
              Lab-grown diamonds allow us to deliver uncompromising luxury while dramatically reducing
              our environmental impact.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "70% Less Carbon",
                desc: "Lab-grown diamonds produce significantly fewer carbon emissions than mined diamonds. Our CVD process uses renewable energy wherever possible, further reducing our carbon footprint with every stone we create.",
                stat: "70%",
              },
              {
                title: "Zero Mining Disruption",
                desc: "Traditional diamond mining displaces millions of tonnes of earth, disrupts ecosystems, and contaminates waterways. Our laboratory process requires no excavation, no land displacement, and no ecological disturbance.",
                stat: "0",
              },
              {
                title: "Fully Traceable Origin",
                desc: "Every Etherstar diamond comes with complete provenance documentation. From the moment a crystal begins growing in our lab to the final setting in your chosen metal, every step is recorded and verifiable.",
                stat: "100%",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-[#E5E2DD] p-8 hover:border-[#D4AF37]/30 transition-colors duration-500"
              >
                <div className="text-4xl font-light text-[#D4AF37] mb-4">
                  {item.stat}
                </div>
                <h3 className="text-lg font-medium text-[#1A202C]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-[#1A202C]/45 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-24 sm:py-32 border-t border-[#E5E2DD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center rounded-full bg-[#D4AF37]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37] mb-6">
              Trusted Worldwide
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1A202C]">
              What Our Clients Say
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "The ring is absolutely stunning. I can't believe it's lab-grown — the sparkle and clarity are identical to mined diamonds I've seen in stores. My fiancée loves it.",
                author: "Arjun M.",
                location: "Mumbai, India",
                stars: 5,
              },
              {
                quote: "I was skeptical about lab-grown diamonds at first, but the IGI certificate and the quality of the pendant completely changed my mind. The gold setting is flawless.",
                author: "Priya K.",
                location: "Delhi, India",
                stars: 5,
              },
              {
                quote: "The customer service team helped me design a custom engagement ring. The whole experience — from consultation to delivery — felt incredibly personal and premium.",
                author: "Rohan S.",
                location: "Bangalore, India",
                stars: 5,
              },
            ].map((item, i) => (
              <motion.div
                key={item.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-[#E5E2DD] p-8 hover:border-[#D4AF37]/30 transition-colors duration-500"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: item.stars }).map((_, si) => (
                    <svg key={si} className="h-4 w-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-[#1A202C]/60 leading-relaxed italic">
                  "{item.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[11px] font-bold text-[#D4AF37]">
                    {item.author[0]}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#1A202C]">
                      {item.author}
                    </p>
                    <p className="text-[10px] text-[#1A202C]/30">
                      {item.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 border-t border-[#E5E2DD]">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1A202C]">
              Stay in the Loop
            </h2>
            <p className="mt-3 text-sm text-[#1A202C]/40 max-w-md mx-auto">
              Get early access to new collections, exclusive member pricing, and insights into the future of ethical luxury.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full sm:flex-1 rounded-xl border border-[#E5E2DD] bg-white px-5 py-3 text-sm text-[#1A202C] placeholder:text-[#1A202C]/25 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
              />
              <button
                type="button"
                className="w-full sm:w-auto rounded-xl bg-[#1A202C] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1A202C]/85 transition-all shadow-lg shadow-[#1A202C]/10"
              >
                Subscribe
              </button>
            </div>
            <p className="mt-3 text-[11px] text-[#1A202C]/20">
              No spam. Unsubscribe anytime. We respect your inbox.
            </p>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32 border-t border-[#E5E2DD]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1A202C] p-12 sm:p-16 text-center"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#D4AF37]/[0.04] blur-[100px]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white">
                Ready to Find Your Perfect Diamond?
              </h2>
              <p className="mt-4 text-base text-white/40 max-w-md mx-auto">
                Browse our complete collection of lab-grown diamond jewelry,
                each piece certified and crafted to last.
              </p>
              <div className="mt-8">
                <Link
                  to="/shop"
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#1A202C] shadow-lg shadow-black/20 hover:shadow-black/30 hover:scale-[1.02] transition-all duration-300"
                >
                  Shop Now
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
