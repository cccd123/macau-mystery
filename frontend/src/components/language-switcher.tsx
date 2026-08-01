"use client";

import { Button } from "@/components/ui/button";
import { useTranslation, LOCALE_LABELS, Locale } from "@/lib/i18n/context";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const locales: Locale[] = ["en", "zh-CN", "zh-TW"];

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={() => setOpen(!open)}
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs">{LOCALE_LABELS[locale]}</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-md py-1 z-50 min-w-[120px]">
          {locales.map((l) => (
            <button
              key={l}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-accent ${
                l === locale ? "font-bold text-primary" : ""
              }`}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
