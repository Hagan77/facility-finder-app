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
  name: "list_offices",
  title: "List offices and regions",
  description:
    "List all regions and their area offices. Use the returned office_id / region_id values to filter facilities, payments, and permitted applications.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = client();
    const [regions, offices] = await Promise.all([
      supabase.from("regions").select("id, name, code").order("name"),
      supabase.from("offices").select("id, region_id, office_name").order("office_name"),
    ]);
    if (regions.error || offices.error) {
      return {
        content: [
          { type: "text", text: regions.error?.message ?? offices.error?.message ?? "Unknown error" },
        ],
        isError: true,
      };
    }
    const payload = { regions: regions.data ?? [], offices: offices.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
