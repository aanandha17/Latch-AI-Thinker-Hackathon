import "server-only";
import { resolveModel } from "agent-core";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  let chatConfigured = false;
  try { resolveModel(); chatConfigured = true; } catch {}
  return Response.json({ chatConfigured }, { headers: { "Cache-Control": "no-store" } });
}
