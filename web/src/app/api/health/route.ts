import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "willmyway",
    time: new Date().toISOString(),
  });
}