import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { ApiErrorHandler } from "@/lib/error-handler";
import { BusinessKycFormData } from "@/app/(protected)/org/kyc/organization/page";
import { uploadFile } from "@/lib/uploader";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body: BusinessKycFormData = {
    contactPersonName: formData.get("contactPersonName") as string,
    contactPersonAadhaar: formData.get("contactPersonAadhaar") as string,
    contactPersonAadhaarDocument: formData.get(
      "contactPersonAadhaarDocument"
    ) as File,
    contactPersonPan: formData.get("contactPersonPan") as string,
    contactPersonPanDocument: formData.get("contactPersonPanDocument") as File,
    organizationName: formData.get("organizationName") as string,
    entityType: formData.get("entityType") as string,
    otherEntityType: formData.get("otherEntityType") as string,
    gstNumber: formData.get("gstNumber") as string,
    gstDocument: formData.get("gstDocument") as File,
    cinNumber: formData.get("cinNumber") as string,
    llpinNumber: formData.get("llpinNumber") as string,
    panNumber: formData.get("panNumber") as string,
    panDocument: formData.get("panDocument") as File,
    registeredAddress: {
      addressLine1: formData.get("registeredAddress.addressLine1") as string,
      addressLine2: formData.get("registeredAddress.addressLine2") as string,
      city: formData.get("registeredAddress.city") as string,
      state: formData.get("registeredAddress.state") as string,
      pincode: formData.get("registeredAddress.pincode") as string,
    },
    registrationCertificate: formData.get("registrationCertificate") as File,
  };

  const providerId = request.nextUrl.searchParams.get("providerId");

  if (
    !providerId ||
    !body.contactPersonName ||
    !body.contactPersonAadhaar ||
    !body.contactPersonPan ||
    !body.registrationCertificate
  ) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // check if all files are present
  if (
    !body.contactPersonAadhaarDocument ||
    !body.contactPersonPanDocument ||
    !body.gstDocument ||
    !body.panDocument
  ) {
    return NextResponse.json(
      { error: "All document files are required" },
      { status: 400 }
    );
  }

  try {
    // upload pan card document and aadhar card document
    const pocPanCardFileExt = body.panDocument.name.split(".").pop();
    const pocPanCardUpload = await uploadFile({
      file: body.panDocument,
      fileExt: pocPanCardFileExt || "",
      folderPath: `kyc/${providerId}/pan_card`,
    });

    const pocAadhaarCardFileExt = body.contactPersonAadhaarDocument.name
      .split(".")
      .pop();
    const pocAadhaarCardUpload = await uploadFile({
      file: body.contactPersonAadhaarDocument,
      fileExt: pocAadhaarCardFileExt || "",
      folderPath: `kyc/${providerId}/aadhaar_card`,
    });

    const gstDocumentFileExt = body.gstDocument.name.split(".").pop();
    const gstDocumentUpload = await uploadFile({
      file: body.gstDocument,
      fileExt: gstDocumentFileExt || "",
      folderPath: `kyc/${providerId}/gst`,
    });
    const regCertificateFileExt = body.registrationCertificate.name
      .split(".")
      .pop();
    const regCertificateUpload = await uploadFile({
      file: body.registrationCertificate,
      fileExt: regCertificateFileExt || "",
      folderPath: `kyc/${providerId}/registration_certificate`,
    });

    const panCardFileExt = body.panDocument.name.split(".").pop();
    const panCardUpload = await uploadFile({
      file: body.panDocument,
      fileExt: panCardFileExt || "",
      folderPath: `kyc/${providerId}/pan_card`,
    });

    const providerVerification = await db.providerVerification.create({
      data: {
        provider: {
          connect: {
            id: providerId,
          },
        },
        pocName: body.contactPersonName,
        pocAadhaarNum: body.contactPersonAadhaar,
        pocAadhaarDoc: pocAadhaarCardUpload.url,
        pocPanNum: body.contactPersonPan,
        pocPanDoc: pocPanCardUpload.url,
        orgCin: body.cinNumber,
        orgLlpin: body.llpinNumber,
        orgPan: body.panNumber,
        orgPanDoc: panCardUpload.url,
        orgGstin: body.gstNumber,
        orgGstDoc: gstDocumentUpload.url,
        orgLegalName: body.organizationName,
        orgType: body.entityType,
        orgOtherType: body.otherEntityType,
        orgRegDoc: regCertificateUpload.url,
        orgName: body.organizationName,
        address: `${body.registeredAddress.addressLine1}, ${body.registeredAddress.addressLine2}, ${body.registeredAddress.city}, ${body.registeredAddress.state}, India - ${body.registeredAddress.pincode}`,
        regAddress: body.registeredAddress,
      },
    });

    await db.provider.update({
      where: {
        id: providerId,
      },
      data: {
        name: body.organizationName,
        adminName: body.contactPersonName,
        city: body.registeredAddress.city,
        region: body.registeredAddress.state,
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
