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
  name: "search_payments",
  title: "Search payments",
  description:
    "Search payment records. Filter by payer name (partial), sector, category, region_id, office_id, or date range (payment_date between from/to, YYYY-MM-DD). Returns up to `limit` rows (default 25, max 200) plus a total_amount sum for the matched rows.",
  inputSchema: {
    name: z.string().trim().min(1).optional(),
    sector: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    region_id: z.string().uuid().optional(),
    office_id: z.string().uuid().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ name, sector, category, region_id, office_id, from, to, limit }) => {
    let q = client()
      .from("payments")
      .select("id, name, sector, category, location, amount_paid, payment_date, region_id, office_id")
      .order("payment_date", { ascending: false })
      .limit(limit ?? 25);
    if (name) q = q.ilike("name", `%${name}%`);
    if (sector) q = q.eq("sector", sector);
    if (category) q = q.eq("category", category);
    if (region_id) q = q.eq("region_id", region_id);
    if (office_id) q = q.eq("office_id", office_id);
    if (from) q = q.gte("payment_date", from);
    if (to) q = q.lte("payment_date", to);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const total = rows.reduce((s, r: any) => s + Number(r.amount_paid ?? 0), 0);
    const payload = { rows, total_amount: total, count: rows.length };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
