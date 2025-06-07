import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    // Validate input
    if (!email || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and OTP are required",
          message: "Email and OTP are required",
        },
        { status: 400 }
      );
    }

    // Verify OTP using centralized service
    const otpResult = await otpService.verifyOTP({ email, otp });

    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: otpResult.message,
          message: otpResult.message,
        },
        { status: 400 }
      );
    }

    // Get provider details
    const provider = await db.provider.findUnique({
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
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Provider not found",
          message: "Provider not found",
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        user: provider,
        message: "Login successful",
      },
      { status: 200 }
    );

    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while verifying OTP",
        message: "An error occurred while verifying OTP",
      },
      { status: 500 }
    );
  }
}
