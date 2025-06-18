import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, phone, otp } = await request.json();

    // Validate input
    if (!firstName || !phone || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: "First name, phone number and OTP are required",
          message: "First name, phone number and OTP are required",
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

    // Check if consumer already exists
    const existingConsumer = await db.consumer.findUnique({
      where: { phone },
    });

    if (existingConsumer) {
      return NextResponse.json(
        {
          success: false,
          error: "Consumer already exists with this phone number",
          message: "Consumer already exists with this phone number",
        },
        { status: 400 }
      );
    }

    // Create consumer after successful OTP verification
    const newConsumer = await db.consumer.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        phone,
        isPhoneVerified: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: newConsumer,
        message: "Registration completed successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error completing consumer registration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while completing registration",
        message: "An error occurred while completing registration",
      },
      { status: 500 }
    );
  }
}
