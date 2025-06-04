import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    // Check if provider exists
    const existingProvider = await db.provider.findUnique({
      where: { email },
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

    // Generate and send OTP using email service
    const otpResult = await otpService.generateAndSendOTP({
      email,
      name: existingProvider.adminName || existingProvider.name,
      purpose: "login",
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
        message: otpResult.message,
        data: {
          email,
          expiresAt: otpResult.expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending OTP:", error);
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
