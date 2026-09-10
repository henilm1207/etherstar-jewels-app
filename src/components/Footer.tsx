import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="relative border-t border-[#E5E2DD] bg-[#F9F8F6]">
      {/* Subtle paper texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand — wider column */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src="/assets/4-2.svg"
                alt="Etherstar Jewels"
                width={40}
                height={40}
                decoding="async"
                className="h-10 w-10 rounded-sm object-contain"
              />
              <div className="flex flex-col">
                <span className="text-base font-semibold tracking-[0.15em] text-[#2C2A29] leading-tight">
                  ETHERSTAR
                </span>
                <span className="text-[10px] font-light tracking-[0.35em] text-[#D4AF37] uppercase leading-tight">
                  Jewels
                </span>
              </div>
            </Link>
            <p className="mt-5 text-sm text-[#2C2A29]/50 leading-relaxed max-w-sm">
              Pioneering the future of fine jewellery with ethically crafted,
              laboratory-grown diamonds. Every stone is IGI-certified, conflict-free,
              and indistinguishable from mined diamonds — at a fraction of the environmental cost.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <span className="text-xs text-[#2C2A29]/30 tracking-wide">etherstarjewels@gmail.com</span>
              <span className="text-[#E5E2DD]">·</span>
              <span className="text-xs text-[#2C2A29]/30 tracking-wide">+91 9725756046</span>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-1" />

          {/* Collections */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2C2A29]/30 mb-5">
              Collections
            </h4>
            <ul className="space-y-3">
              {["Rings", "Earrings", "Pendants", "Bracelets"].map((item) => (
                <li key={item}>
                  <Link
                    to={`/shop?category=${item}`}
                    className="text-sm text-[#2C2A29]/45 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2C2A29]/30 mb-5">
              About
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Our Story", hash: "#our-story" },
                { label: "Lab-Grown Diamonds", hash: "#lab-grown" },
                { label: "The 4Cs", hash: "#4cs" },
                { label: "Sustainability", hash: "#sustainability" },
              ].map((item) => (
                <li key={item.hash}>
                  <Link
                    to={`/${item.hash}`}
                    className="text-sm text-[#2C2A29]/45 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2C2A29]/30 mb-5">
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <span className="block text-xs text-[#2C2A29]/30 uppercase tracking-wider mb-1">Days</span>
                <span className="text-sm text-[#2C2A29]/45">Mon — Sat</span>
              </li>
              <li>
                <span className="block text-xs text-[#2C2A29]/30 uppercase tracking-wider mb-1">Timing</span>
                <span className="text-sm text-[#2C2A29]/45">10am — 7pm IST</span>
              </li>
              <li>
                <Link
                  to="/custom-design"
                  className="text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors duration-300 cursor-pointer underline underline-offset-4 decoration-[#D4AF37]/30 hover:decoration-[#D4AF37]"
                >
                  Custom Design
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#E5E2DD]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#2C2A29]/25 tracking-wide">
            © 2026 Etherstar Jewels. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-[#2C2A29]/25 tracking-wide cursor-pointer hover:text-[#D4AF37] transition-colors">
              Privacy Policy
            </span>
            <span className="text-xs text-[#2C2A29]/25 tracking-wide cursor-pointer hover:text-[#D4AF37] transition-colors">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
