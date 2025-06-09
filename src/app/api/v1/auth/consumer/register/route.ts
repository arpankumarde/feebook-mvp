import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  const { phone, password } = await request.json();

  // Validate input
  if (!phone || !password) {
    return NextResponse.json(
      {
        success: false,
        error: "Phone number and password are required",
        message: "Phone number and password are required",
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

  // Validate password length
  if (password.length < 6) {
    return NextResponse.json(
      {
        success: false,
        error: "Password must be at least 6 characters long",
        message: "Password must be at least 6 characters long",
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

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create consumer with unverified status
    const newConsumer = await db.consumer.create({
      data: {
        phone,
        password: hashedPassword,
        isPhoneVerified: false,
      },
    });

    // Send OTP for phone verification
    const otpResult = await otpService.generateAndSendOTP({
      phone,
      purpose: "verification",
      channel: "SMS",
    });

    if (!otpResult.success) {
      // If OTP sending fails, delete the created consumer
      await db.consumer.delete({
        where: { id: newConsumer.id },
      });

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
          "Registration initiated. Please verify your phone number with the OTP sent.",
        expiresAt: otpResult.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating consumer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create consumer",
        message: "Failed to create consumer",
      },
      { status: 500 }
    );
  }
}
