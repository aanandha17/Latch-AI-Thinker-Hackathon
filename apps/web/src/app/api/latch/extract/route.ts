import { createExtractionHandler } from "@/lib/server/latch-extract-http";
import { extractThread } from "@/lib/server/latch-extract";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createExtractionHandler(extractThread);
