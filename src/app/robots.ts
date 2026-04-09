import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vericum.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/my-content", "/earnings", "/settings", "/downloads", "/bookmarks"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
