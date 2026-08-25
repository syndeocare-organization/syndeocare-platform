import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { locales } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const paths = ["", "/privacy", "/support", "/delete-account"];
  return locales.flatMap((locale) => paths.map((path) => ({ url: `${base}/${locale}${path}`, lastModified: new Date(), changeFrequency: path ? "monthly" as const : "weekly" as const, priority: path ? 0.6 : 1 })));
}
