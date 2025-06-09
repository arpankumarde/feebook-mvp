import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    // Validate input
    if (!phone || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number and OTP are required",
          message: "Phone number and OTP are required",
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number format",
          message: "Phone number must be 10 digits",
        },
        { status: 400 }
      );
    }

    // Verify OTP using centralized service
    const otpResult = await otpService.verifyOTP({ phone, otp });

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

    // Find and update consumer to mark as verified
    const consumer = await db.consumer.findUnique({
      where: { phone },
    });

    if (!consumer) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer not found",
          message: "Consumer not found",
        },
        { status: 404 }
      );
    }

    // Update consumer verification status
    const updatedConsumer = await db.consumer.update({
      where: { phone },
      data: {
        isPhoneVerified: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: updatedConsumer,
        message: "Phone number verified successfully. Registration completed!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying registration OTP:", error);
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
