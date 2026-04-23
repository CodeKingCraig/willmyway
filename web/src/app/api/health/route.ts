import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "KeepSave",
    time: new Date().toISOString(),
  });
}
