import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const body = await request.json();
  const { password, hash } = body;
  
  const match = await bcrypt.compare(password, hash);
  return NextResponse.json({ match });
} 