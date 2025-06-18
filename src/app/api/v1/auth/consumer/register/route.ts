import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  const { firstName, lastName, phone } = await request.json();

  // Validate input
  if (!firstName || !phone) {
    return NextResponse.json(
      {
        success: false,
        error: "First name and phone number are required",
        message: "First name and phone number are required",
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

  // Validate name length
  if (firstName.trim().length < 2) {
    return NextResponse.json(
      {
        success: false,
        error: "First name must be at least 2 characters long",
        message: "First name must be at least 2 characters long",
      },
      { status: 400 }
    );
  }

  try {
    // Check if phone already exists
    const existingConsumer = await db.consumer.findUnique({
      where: { phone },
    });

    if (existingConsumer) {
      return NextResponse.json(
        {
          success: false,
          error: "This phone number is already registered",
          message: "This phone number is already registered",
        },
        { status: 400 }
      );
    }

    // Send OTP for phone verification without creating consumer yet
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
        message:
          "OTP sent successfully. Please verify your phone number to complete registration.",
        data: {
          firstName,
          lastName,
          phone,
        },
        expiresAt: otpResult.expiresAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error initiating consumer registration:", error);
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
