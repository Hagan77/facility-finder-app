import { defineMcp } from "@lovable.dev/mcp-js";
import listOffices from "./tools/list-offices";
import searchFacilities from "./tools/search-facilities";
import searchPayments from "./tools/search-payments";
import searchPermittedApplications from "./tools/search-permitted-applications";

export default defineMcp({
  name: "facility-finder-mcp",
  title: "Facility Finder MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Facility Finder database. Call `list_offices` first to discover region_id and office_id values, then use them to filter `search_facilities`, `search_payments`, and `search_permitted_applications`. This server is public — all data returned is accessible without authentication.",
  tools: [listOffices, searchFacilities, searchPayments, searchPermittedApplications],
});
