import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
// Browser uploads straight to Vercel Blob (bypasses the 4.5 MB serverless body limit).
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({ body, request: req,
      onBeforeGenerateToken: async () => {
        if (!(await getUser())) throw new Error("Not signed in");
        return { maximumSizeInBytes: 50 * 1024 * 1024, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {} });
    return NextResponse.json(json);
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
