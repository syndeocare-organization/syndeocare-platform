import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/ar", "/en", "/ar/privacy", "/en/privacy", "/ar/support", "/en/support", "/ar/delete-account", "/en/delete-account"], disallow: ["/api/", "/*/auth/", "/*/dashboard", "/*/onboarding", "/*/shifts"] },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
