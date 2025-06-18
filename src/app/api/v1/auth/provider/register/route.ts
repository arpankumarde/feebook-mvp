import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

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
      {
        success: false,
        error: "All fields are required",
        message: "All fields are required",
      },
      { status: 400 }
    );
  }

  try {
    // Check if email already exists
    const existingProviderByEmail = await db.provider.findUnique({
      where: { email },
    });

    if (existingProviderByEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
          message: "Email already registered",
        },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingProviderByPhone = await db.provider.findUnique({
      where: { phone },
    });

    if (existingProviderByPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number already registered",
          message: "Phone number already registered",
        },
        { status: 400 }
      );
    }

    // Check if same code is used for different providers
    const existingProviderByCode = await db.provider.findUnique({
      where: { code },
    });

    if (existingProviderByCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Code already exists",
          message: "Code already exists",
        },
        { status: 400 }
      );
    }

    // Generate and send OTP for email verification
    const otpResult = await otpService.generateAndSendOTP({
      email,
      name: adminName || name,
      purpose: "verification",
      channel: "EMAIL",
    });

    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.message,
          message: otpResult.message,
        },
        { status: 500 }
      );
    }

    // Store registration data temporarily (you might want to use Redis or a temporary table)
    // For now, we'll return the data to be stored on frontend
    return NextResponse.json(
      {
        success: true,
        message:
          "OTP sent successfully. Please verify your email to complete registration.",
        data: {
          name,
          adminName: adminName || name,
          email,
          phone,
          password,
          code,
          accountType,
          category,
        },
        expiresAt: otpResult.expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initiating provider registration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initiate registration",
        message: "Failed to initiate registration",
      },
      { status: 500 }
    );
  }
}
