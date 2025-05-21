import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const {
    name,
    adminName,
    email,
    phone,
    password,
    code,
    accountType,
    category,
  } = await request.json();

  // Validate input
  if (!name || !email || !phone || !password || !code || !accountType) {
    return NextResponse.json(
      { success: false, error: "All fields are required" },
      { status: 400 }
    );
  }

  console.log(typeof phone);

  try {
    // check if same code is used for different providers
    const existingProvider = await db.provider.findUnique({
      where: { code },
    });

    if (existingProvider) {
      return NextResponse.json(
        { success: false, error: "Code already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newProvider = await db.provider.create({
      data: {
        name,
        adminName: adminName || name,
        email,
        phone,
        password: hashedPassword,
        code,
        type: accountType,
        category: category,
      },
    });

    return NextResponse.json(
      { success: true, provider: newProvider },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create provider" },
      { status: 500 }
    );
  }
}
