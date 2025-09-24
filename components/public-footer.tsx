"use client";

import Link from "next/link";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="public-footer bg-black text-white" style={{ minHeight: '200px', backgroundColor: 'black' }}>
      <style jsx>{`
        .public-footer {
          background: #000 !important;
          color: #fff !important;
        }
        .public-footer *,
        .public-footer a,
        .public-footer p,
        .public-footer h1,
        .public-footer h2,
        .public-footer h3,
        .public-footer h4,
        .public-footer h5,
        .public-footer h6,
        .public-footer span,
        .public-footer li {
          color: #fff !important;
        }
      `}</style>
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold mb-3">ClinicStock by Muhdev</h3>
            <p className="mb-4 leading-relaxed opacity-90">
              Streamline your pharmacy operations with real‑time stock, smart sales, and insightful reports.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" aria-label="Facebook" className="opacity-90 hover:opacity-100 transition-opacity">Fb</a>
              <a href="#" aria-label="Twitter" className="opacity-90 hover:opacity-100 transition-opacity">Tw</a>
              <a href="#" aria-label="LinkedIn" className="opacity-90 hover:opacity-100 transition-opacity">In</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 opacity-90">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 opacity-90">
              <li><Link href="/pricing">Pricing</Link></li>
              <li><Link href="/docs">Documentation</Link></li>
              <li><Link href="/faq">FAQs</Link></li>
              <li><Link href="/changelog">Changelog</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Stay Updated</h4>
            <p className="mb-3 opacity-90">Get product updates and tips. No spam.</p>
            <form className="flex items-stretch gap-2">
              <input
                type="email"
                placeholder="Your email"
                aria-label="Email address"
                className="w-full rounded-md px-3 py-2 bg-white/10 outline-none border border-white/20 placeholder-white/70"
              />
              <button type="button" className="rounded-md px-4 py-2 bg-white/20 hover:bg-white/30 transition-colors">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm opacity-80">© {currentYear} Muhdev Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm opacity-80">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/status">System Status</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
