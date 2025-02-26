import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  const body = await request.json();
  const { password } = body;
  
  const hash = await bcrypt.hash(password, 10);
  return NextResponse.json({ hash });
} 