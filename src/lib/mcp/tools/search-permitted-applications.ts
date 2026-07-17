import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function client() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export default defineTool({
  name: "search_permitted_applications",
  title: "Search permitted applications",
  description:
    "Search permitted-application records. Filter by facility name (partial), sector, district, region_id, or office_id. Returns up to `limit` rows (default 25, max 200).",
  inputSchema: {
    name: z.string().trim().min(1).optional(),
    sector: z.string().trim().min(1).optional(),
    district: z.string().trim().min(1).optional(),
    region_id: z.string().uuid().optional(),
    office_id: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ name, sector, district, region_id, office_id, limit }) => {
    let q = client()
      .from("permitted_applications")
      .select("id, name, sector, location, district, effective_date, expiry_date, region_id, office_id")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (name) q = q.ilike("name", `%${name}%`);
    if (sector) q = q.eq("sector", sector);
    if (district) q = q.ilike("district", `%${district}%`);
    if (region_id) q = q.eq("region_id", region_id);
    if (office_id) q = q.eq("office_id", office_id);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
