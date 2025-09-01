import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import otpService from "@/lib/otp-service";

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      adminName,
      email,
      phone,
      password,
      code,
      accountType,
      category,
      otp,
    } = await request.json();

    // Validate input
    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !code ||
      !accountType ||
      !otp
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "All fields including OTP are required",
          message: "All fields including OTP are required",
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

    // Double-check if email, phone, or code already exists (in case of race conditions)
    const [existingEmail, existingPhone, existingCode] = await Promise.all([
      db.provider.findUnique({ where: { email } }),
      db.provider.findUnique({ where: { phone } }),
      db.provider.findUnique({ where: { code } }),
    ]);

    if (existingEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Email already registered",
          message: "Email already registered",
        },
        { status: 400 }
      );
    }

    if (existingPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone number already registered",
          message: "Phone number already registered",
        },
        { status: 400 }
      );
    }

    if (existingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Code already exists",
          message: "Code already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create provider with email verified
    const newProvider = await db.provider.create({
      data: {
        name,
        adminName: adminName || name,
        email,
        phone,
        password: hashedPassword,
        code,
        type: accountType,
        category: category || "OTHER",
        isEmailVerified: true,
        isVerified: true,
      },
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
        isEmailVerified: true,
        isPhoneVerified: true,
        walletBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // approve by default - new
    await db.providerVerification.create({
      data: {
        provider: {
          connect: {
            id: newProvider.id,
          },
        },
        address: "EMPTY",
        orgName: name,
        pocAadhaarDoc: "EMPTY",
        pocAadhaarNum: "EMPTY",
        pocName: (adminName as string) || (name as string) || "EMPTY",
        pocPanDoc: "EMPTY",
        pocPanNum: "EMPTY",
        status: "VERIFIED",
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: newProvider,
        message: "Provider account created successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error completing provider registration:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete registration",
        message: "Failed to complete registration",
      },
      { status: 500 }
    );
  }
}
