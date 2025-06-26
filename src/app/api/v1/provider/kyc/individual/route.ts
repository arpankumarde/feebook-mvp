import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";
import { PersonalKycFormData } from "@/app/(protected)/org/kyc/individual/page";
import { uploadFile } from "@/lib/uploader";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body: PersonalKycFormData = {
    fullName: formData.get("fullName") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    permanentAddress: {
      addressLine1: formData.get("permanentAddress.addressLine1") as string,
      addressLine2: formData.get("permanentAddress.addressLine2") as string,
      city: formData.get("permanentAddress.city") as string,
      state: formData.get("permanentAddress.state") as string,
      pincode: formData.get("permanentAddress.pincode") as string,
    },
    panCard: {
      panNumber: formData.get("panCard.panNumber") as string,
      documentFile: formData.get("panCard.documentFile") as File,
    },
    aadhaarCard: {
      aadhaarNumber: formData.get("aadhaarCard.aadhaarNumber") as string,
      documentFile: formData.get("aadhaarCard.documentFile") as File,
    },
  };

  const pancardDocFile = formData.get("panCard.documentFile") as File;
  const aadhaarCardDocFile = formData.get("aadhaarCard.documentFile") as File;

  const providerId = request.nextUrl.searchParams.get("providerId");

  if (
    !providerId ||
    !body.fullName ||
    !body.dateOfBirth ||
    !body.permanentAddress ||
    !pancardDocFile ||
    !aadhaarCardDocFile
  ) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  try {
    // upload pan card document and aadhar card document
    const panCardFileExt = pancardDocFile.name.split(".").pop();
    const panCardUpload = await uploadFile({
      file: pancardDocFile,
      fileExt: panCardFileExt || "",
      folderPath: `kyc/${providerId}/pan_card`,
    });

    const aadharCardFileExt = aadhaarCardDocFile.name.split(".").pop();
    const aadharCardUpload = await uploadFile({
      file: aadhaarCardDocFile,
      fileExt: aadharCardFileExt || "",
      folderPath: `kyc/${providerId}/aadhaar_card`,
    });

    const providerVerification = await db.providerVerification.create({
      data: {
        provider: {
          connect: {
            id: providerId,
          },
        },
        pocName: body.fullName,
        pocAadhaarNum: body.aadhaarCard.aadhaarNumber,
        pocAadhaarDoc: aadharCardUpload.url,
        pocPanNum: body.panCard.panNumber,
        pocPanDoc: panCardUpload.url,
        pocDob: new Date(body.dateOfBirth),
        orgName: body.fullName,
        address: `${body.permanentAddress.addressLine1}, ${body.permanentAddress.addressLine2}, ${body.permanentAddress.city}, ${body.permanentAddress.state}, India - ${body.permanentAddress.pincode}`,
        regAddress: body.permanentAddress,
      },
    });

    await db.provider.update({
      where: {
        id: providerId,
      },
      data: {
        adminName: body.fullName,
        city: body.permanentAddress.city,
        region: body.permanentAddress.state,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "KYC submitted successfully",
        data: providerVerification,
      },
      { status: 200 }
    );
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}

export async function GET(request: NextRequest) {
  const providerId = request.nextUrl.searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json(
      { error: "Provider ID is required" },
      { status: 400 }
    );
  }

  try {
    const provider = await db.provider.findUnique({
      where: {
        id: providerId,
      },
      include: {
        verification: true,
      },
    });

    if (!provider?.verification) {
      return NextResponse.json(
        { success: false, error: "Provider KYC not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: provider,
      },
      { status: 200 }
    );
  } catch (error) {
    return ApiErrorHandler.handlePrismaError(error);
  }
}
