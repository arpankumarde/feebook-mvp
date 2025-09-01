import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/lib/uploader";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderPath = formData.get("folderPath") as string | undefined;
    let fileName = formData.get("fileName") as string | undefined;
    let fileExt = formData.get("fileExt") as string | undefined;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!fileExt) {
      fileExt = file.name.split(".").pop() || "bin";
    }

    if (!fileName) {
      fileName = file.name.split(".").slice(0, -1).join(".") || "upload";
    }

    const result = await uploadFile({
      file,
      fileExt,
      fileName,
      folderPath,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      contentType: result.contentType,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}
