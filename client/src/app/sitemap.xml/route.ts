import dishApiRequest from "@/apiRequests/dish";
import envConfig, { locales } from "@/config";
import { generateSlugUrl } from "@/lib/utils";

const staticRoutes = [
  {
    url: "",
    changeFrequency: "daily" as const,
    priority: 1,
  },
  {
    url: "/login",
    changeFrequency: "yearly" as const,
    priority: 0.5,
  },
];

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every 1 hour

export async function GET() {
  let dishList: Array<{ id: number; name: string; updatedAt: Date }> = [];

  try {
    const result = await dishApiRequest.list();
    dishList = result.payload.data;
  } catch (error) {
    console.log("Warning: Could not fetch dishes for sitemap generation:", error);
  }

  const localizeStaticSiteMap = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${envConfig.NEXT_PUBLIC_URL}/${locale}${route.url}`,
      lastModified: new Date().toISOString(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }))
  );

  const localizeDishSiteMap = locales.flatMap((locale) =>
    dishList.map((dish) => ({
      url: `${envConfig.NEXT_PUBLIC_URL}/${locale}/dishes/${generateSlugUrl({
        id: dish.id,
        name: dish.name,
      })}`,
      lastModified: new Date(dish.updatedAt).toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }))
  );

  const allUrls = [...localizeStaticSiteMap, ...localizeDishSiteMap];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `  <url>
    <loc>${url.url}</loc>
    <lastmod>${url.lastModified}</lastmod>
    <changefreq>${url.changeFrequency}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
