import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required",
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    // Check if email already exists and is verified
    const existingProvider = await db.provider.findUnique({
      where: { email },
    });

    if (existingProvider && existingProvider.isEmailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered and verified",
          message: "Email already registered and verified",
        },
        { status: 400 }
      );
    }

    // Generate and send OTP for email verification
    const otpResult = await otpService.generateAndSendOTP({
      email,
      name: name || "User",
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

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        expiresAt: otpResult.expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending registration OTP:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while sending OTP",
        message: "An error occurred while sending OTP",
      },
      { status: 500 }
    );
  }
}
