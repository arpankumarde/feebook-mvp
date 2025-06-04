import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  // Validate input
  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        error: "All fields are required",
        message: "All fields are required",
      },
      { status: 400 }
    );
  }

  try {
    // Check if provider exists
    const existingProvider = await db.provider.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        adminName: true,
        email: true,
        phone: true,
        type: true,
        category: true,
        status: true,
        code: true,
        isVerified: true,
        walletBalance: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!existingProvider) {
      return NextResponse.json(
        {
          success: false,
          error: "Provider not found",
          message: "Provider not found",
        },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingProvider.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid password",
          message: "Invalid password",
        },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...providerData } = existingProvider;

    const response = NextResponse.json(
      {
        success: true,
        user: providerData,
        message: "Login successful",
      },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error("Provider login error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred during login",
        message: "An error occurred during login",
      },
      { status: 500 }
    );
  }
}
