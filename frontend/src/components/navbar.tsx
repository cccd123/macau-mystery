"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, LogOut, User, Shield } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/language-switcher";

const navItems = [
  { href: "/", labelKey: "nav.home" },
  { href: "/game/select", labelKey: "nav.play" },
  { href: "/game/map", labelKey: "nav.map" },
  { href: "/create", labelKey: "nav.create" },
  { href: "/community", labelKey: "nav.community" },
  { href: "/my-scripts", labelKey: "nav.myScripts" },
  { href: "/admin", labelKey: "nav.admin", adminOnly: true },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-bold text-lg"
        >
          {/* Lotus-inspired logo mark */}
          <span className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-jade to-azulejo text-primary-foreground shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg">
            <span className="text-base font-bold">M</span>
            {/* Subtle glow ring */}
            <span className="absolute inset-0 rounded-xl ring-2 ring-primary/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </span>
          <span className="hidden sm:inline tracking-tight">
            {t("nav.brand")}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {visibleItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                size="sm"
                className={`transition-all duration-200 ${
                  pathname === item.href
                    ? "shadow-sm"
                    : "hover:bg-primary/5"
                }`}
              >
                {t(item.labelKey)}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                {user.role === "admin" ? (
                  <Shield className="h-3.5 w-3.5 text-brass" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
                {user.nickname || user.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="btn-shimmer">
                {t("nav.login")}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-64 glass">
            <nav className="flex flex-col gap-2 mt-8">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    {t(item.labelKey)}
                  </Button>
                </Link>
              ))}
              <hr className="my-2 border-border/50" />
              <div className="px-4 py-2">
                <LanguageSwitcher />
              </div>
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                    {user.role === "admin" ? (
                      <Shield className="h-4 w-4 text-brass" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {user.nickname || user.username}
                  </div>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> {t("nav.logout")}
                  </Button>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button className="w-full btn-shimmer">
                    {t("nav.login")}
                  </Button>
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
