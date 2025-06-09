import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    // Validate input
    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number is required",
          message: "Phone number is required",
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

    // Check if consumer exists and is not verified
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

    if (consumer.isPhoneVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number already verified",
          message: "Phone number already verified",
        },
        { status: 400 }
      );
    }

    // Send OTP for phone verification
    const otpResult = await otpService.generateAndSendOTP({
      phone,
      purpose: "verification",
      channel: "SMS",
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
