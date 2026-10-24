"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const guestLinks = [
  { href: "/jobs", label: "Jobs" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
  { href: "/support", label: "Support" },
];

const freelancerLinks = [
  { href: "/freelancer/jobs", label: "Get Jobs" },
  { href: "/career-navigator", label: "Career Navigator" },
  { href: "/tasks", label: "Tasks" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/chatbot", label: "AI Assistant" },
];

const clientLinks = [
  { href: "/client/post-job", label: "Post Job" },
  { href: "/jobs", label: "Browse Jobs" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/chatbot", label: "AI Assistant" },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/tasks", label: "Tasks" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/support", label: "Support" },
];

function getBrandHref(user: ReturnType<typeof useAuth>["user"]) {
  return user ? "/dashboard" : "/";
}

function getMemberLinks(user: ReturnType<typeof useAuth>["user"]) {
  if (!user) return guestLinks;
  if (user.role === "FREELANCER") return freelancerLinks;
  if (user.role === "CLIENT") return clientLinks;
  return adminLinks;
}

function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const brandHref = getBrandHref(user);

  function handleLogout() {
    logout();
    router.push("/");
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const links = user ? getMemberLinks(user) : guestLinks;
  const isHeroPage = pathname === "/";
  const showDarkNav = isHeroPage && !scrolled;

  const navClasses = scrolled
    ? "nav-glass shadow-card-sm"
    : isHeroPage
      ? "bg-transparent border-transparent"
      : "nav-glass shadow-card-sm";

  const linkTextClass = showDarkNav
    ? "text-white/80 hover:text-white"
    : "text-surface-600 hover:text-surface-900";

  const activeLinkClass = showDarkNav
    ? "text-white bg-white/10"
    : "text-primary-700 bg-primary-50";

  return (
    <>
      <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${navClasses}`}>
        {/* Accent line at the very top */}
        <div className="h-[2px] w-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 opacity-80" />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link href={brandHref} className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 shadow-md shadow-primary-600/25 transition-transform duration-200 group-hover:scale-105">
              <span className="text-sm font-black text-white">2G</span>
            </div>
            <span className={`text-base font-bold tracking-tight transition-colors ${showDarkNav ? "text-white" : "text-surface-900"}`}>
              2Gathers
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    active ? activeLinkClass : linkTextClass
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary-600"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    showDarkNav
                      ? "text-white/90 hover:bg-white/10"
                      : "text-surface-700 hover:bg-surface-100"
                  }`}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 text-[11px] font-bold text-white shadow-sm">
                    {(user.username || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.username}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-surface-200 bg-white p-1.5 shadow-card-lg"
                    >
                      <div className="border-b border-surface-100 px-3 py-2 mb-1">
                        <p className="text-sm font-semibold text-surface-900 truncate">{user.username}</p>
                        <p className="text-xs text-surface-500 truncate">{user.email}</p>
                        <span className="mt-1 inline-block rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-700">
                          {user.role}
                        </span>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-surface-700 transition hover:bg-surface-50"
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/wallet"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-surface-700 transition hover:bg-surface-50"
                      >
                        Wallet
                      </Link>
                      <div className="my-1 border-t border-surface-100" />
                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setUserMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 transition hover:bg-danger-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${linkTextClass}`}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary-600/25 transition-all duration-200 hover:shadow-lg hover:shadow-primary-600/30 active:scale-[0.98]"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            type="button"
            className={`rounded-xl p-2 transition md:hidden ${
              showDarkNav
                ? "text-white hover:bg-white/10"
                : "text-surface-700 hover:bg-surface-100"
            }`}
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-surface-900/20 backdrop-blur-sm md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              key="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-full w-[280px] border-l border-surface-200 bg-white shadow-2xl md:hidden"
            >
              <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
                <Link href={brandHref} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-600">
                    <span className="text-xs font-black text-white">2G</span>
                  </div>
                  <span className="font-bold text-surface-900">2Gathers</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1 px-3 py-4">
                {links.map((link) => {
                  const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary-50 text-primary-700"
                          : "text-surface-700 hover:bg-surface-50 hover:text-surface-900"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mx-3 mt-2 space-y-2 border-t border-surface-100 pt-4">
                {user ? (
                  <>
                    <div className="rounded-xl bg-surface-50 px-4 py-3">
                      <p className="text-sm font-semibold text-surface-900">{user.username}</p>
                      <p className="text-xs text-surface-500">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-danger-600 transition hover:bg-danger-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-surface-700 transition hover:bg-surface-50"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Close user dropdown when clicking away */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  );
}

export { Navbar };
export default Navbar;
