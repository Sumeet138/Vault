import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";

interface LandingLayoutProps {
  children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  const { scrollY } = useScroll();
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // Transform width based on scroll position
  // We'll use a percentage width that decreases as we scroll
  const width = useTransform(scrollY, [0, 100], ["100%", "80%"]);
  // Also adjust max-width constraints
  const maxWidth = useTransform(scrollY, [0, 100], ["72rem", "60rem"]); // 6xl to 5xl
  const y = useTransform(scrollY, [0, 100], [0, 10]); // Slight move down

  return (
    <div className="min-h-screen flex flex-col font-sans text-foreground bg-[url(https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/hero/gradientBackground.png)] bg-cover bg-top bg-no-repeat">
      <header className="w-full fixed top-0 z-50 px-4 py-4 flex justify-center">
        <motion.div
          style={{ width, maxWidth, y }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 flex items-center justify-between shadow-sm shadow-black/5 transition-all duration-300 ease-out"
        >
          <Link href="/" className="flex items-center gap-2">
            <div className="text-xl font-bold text-gray-900 tracking-tight">
              vault
            </div>
          </Link>
          <nav className="flex items-center gap-6" onMouseLeave={() => setHoveredLink(null)}>
            {["Dashboard", "Links", "Activity", "Settings"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative px-2 py-1"
                onMouseEnter={() => setHoveredLink(item)}
              >
                {item}
                {hoveredLink === item && (
                  <motion.div
                    layoutId="navbar-hover"
                    className="absolute inset-0 bg-gray-100/50 rounded-md -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <a
              href="https://github.com/ayuxy027"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </a>
          </nav>
        </motion.div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="w-full border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="flex items-center gap-2">
              <div className="text-xl font-bold text-gray-900 tracking-tight">
                vault
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-500 max-w-sm">
              Private-by-default payment links. Fresh addresses per payment.
              Full self-custody.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">Product</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-gray-900"
                >
                  Create a link
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-gray-900"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-gray-500 hover:text-gray-900"
                >
                  Templates
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-500 hover:text-gray-900">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-500 hover:text-gray-900">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-black/5">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} VAULT. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-900"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
