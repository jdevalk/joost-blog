import type { APIRoute } from "astro";
import { search, getEmDashEntry } from "emdash";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
	const q = url.searchParams.get("q")?.trim();
	if (!q || q.length < 2) {
		return new Response(JSON.stringify({ data: { items: [] } }), {
			headers: { "Content-Type": "application/json" },
		});
	}

	const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 20);
	const collections = url.searchParams.get("collections")?.split(",").map(s => s.trim()).filter(Boolean);

	try {
		const result = await search(q, {
			collections,
			status: "published",
			limit,
		});

		// Enrich results with excerpts
		const items = await Promise.all(
			(result.items || []).map(async (item: any) => {
				try {
					const { entry } = await getEmDashEntry(item.collection, item.slug || item.id);
					return { ...item, excerpt: entry?.data?.excerpt || undefined };
				} catch {
					return item;
				}
			})
		);

		return new Response(JSON.stringify({ data: { items } }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		return new Response(JSON.stringify({ data: { items: [] } }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
};
