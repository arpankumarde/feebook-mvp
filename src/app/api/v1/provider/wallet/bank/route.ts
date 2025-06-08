import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";
import cfvrs from "@/lib/cfpg_vrs";
import {
  BAVAccountStatus,
  BAVAccountStatusCode,
  BAVNameMatchResult,
} from "@/types/vrs/BAV";

interface BAV {
  reference_id?: number;
  name_at_bank?: string;
  bank_name?: string;
  utr?: string | null;
  city?: string;
  branch?: string;
  micr?: number;
  name_match_score?: string | null;
  name_match_result?: BAVNameMatchResult | null;
  account_status?: BAVAccountStatus;
  account_status_code?: BAVAccountStatusCode;
  ifsc_details?: {
    bank: string;
    ifsc: string;
    micr: number;
    nbin: string | null;
    address: string;
    city: string;
    state: string;
    branch: string;
    ifsc_subcode: string;
    category: string | null;
    swift_code: string | null;
  };
  type: string;
  code?: string;
  message?: string;
  error?: object;
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const providerId = searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json(
      {
        success: false,
        error: "Provider ID is required",
        message: "Provider ID is required",
      },
      { status: 400 }
    );
  }

  const { accNumber, ifsc, accName, accPhone, vpa } = await request.json();
  if (!accNumber || !ifsc || !accName || !accPhone) {
    return NextResponse.json(
      {
        success: false,
        error: "All account details are required",
        message: "All account details are required",
      },
      { status: 400 }
    );
  }

  try {
    const { data } = await cfvrs.post<BAV>("/verification/bank-account/sync", {
      bank_account: accNumber,
      ifsc: ifsc,
      name: accName,
      phone: accPhone,
    });

    if (data.account_status === BAVAccountStatus.VALID) {
      const newBank = await db.bankAccount.create({
        data: {
          provider: {
            connect: { id: providerId },
          },
          accNumber: accNumber,
          ifsc: ifsc,
          accName: data?.name_at_bank || accName,
          accPhone: accPhone,
          refId: data.reference_id?.toString() || null,
          bankName: data.bank_name || null,
          branchName: data.branch || null,
          vpa: vpa || null,
          verifierResponse: JSON.parse(JSON.stringify(data)),
          verificationStatus: "VERIFIED",
        },
      });
      return NextResponse.json(
        {
          success: true,
          data: newBank,
          message: "Bank account verification succeeded",
        },
        { status: 200 }
      );
    } else if (data.account_status === BAVAccountStatus.INVALID) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank account verification failed",
          message:
            data.account_status_code || "Bank account verification failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return ApiErrorHandler.handleApiError(
      error,
      "Bank account verification failed"
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const providerId = searchParams.get("providerId");
  const getDefault = searchParams.get("default");

  if (!providerId) {
    return NextResponse.json(
      {
        success: false,
        error: "Provider ID is required",
        message: "Provider ID is required",
      },
      { status: 400 }
    );
  }

  try {
    const bankAccounts = await db.bankAccount.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });

    if (getDefault) {
      const defaultAccount =
        bankAccounts.find((acc) => acc.isDefault) || bankAccounts[0];
      return NextResponse.json(
        {
          success: true,
          data: [defaultAccount],
          message: "Default bank account retrieved successfully",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: bankAccounts,
        message: "Bank accounts retrieved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function PATCH(request: NextRequest) {
  const { providerId, bankAccountId } = await request.json();

  if (!providerId || !bankAccountId) {
    return NextResponse.json(
      {
        success: false,
        error: "Provider ID and Bank Account ID are required",
        message: "Provider ID and Bank Account ID are required",
      },
      { status: 400 }
    );
  }

  try {
    const updatedBankAccount = await db.bankAccount.update({
      where: { id: bankAccountId },
      data: { isDefault: true },
    });

    // Reset other bank accounts to not default
    await db.bankAccount.updateMany({
      where: {
        id: { not: bankAccountId },
        providerId,
      },
      data: { isDefault: false },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedBankAccount,
        message: "Bank account set as default successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}
