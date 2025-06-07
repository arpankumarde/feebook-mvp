import {
  S3Client,
  ListBucketsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Create an S3 client
const client = new S3Client({
  region: process.env.AWS_S3_REGION || "",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
  },
});

// Use async/await to send the command
// (async () => {
//   try {
//     const data = await client.send(new ListBucketsCommand({}));
//     console.log("Buckets:", data.Buckets);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// })();

const uploadFile = async ({
  fileName = uuidv4(),
  fileExt,
  file,
  folderPath,
}: {
  fileName?: string;
  fileExt: string;
  file: File | Blob;
  folderPath?: string;
}) => {
  try {
    // Convert File/Blob to ArrayBuffer then to Buffer for proper S3 upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const key = folderPath
      ? `${folderPath.replace(/^\/+|\/+$/g, "")}/${fileName}.${fileExt}`
      : `${fileName}.${fileExt}`;

    // Get proper MIME type from file extension or file type
    const getContentType = (extension: string, fileType?: string): string => {
      if (fileType) return fileType;

      const mimeTypes: Record<string, string> = {
        pdf: "application/pdf",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        txt: "text/plain",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };

      return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
    };

    const contentType = getContentType(
      fileExt,
      file instanceof File ? file.type : undefined
    );

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentLength: buffer.length,
    });

    const result = await client.send(uploadCommand);

    if (result.$metadata.httpStatusCode !== 200) {
      throw new Error(
        `Error uploading file, with status: ${result.$metadata.httpStatusCode}`
      );
    }

    const fileUrl = `${process.env.AWS_S3_DIST_URL}/${key}`;

    console.log(`File uploaded successfully: ${key}`);

    return {
      success: true,
      url: fileUrl,
      key: key,
      contentType: contentType,
    };
  } catch (err: any) {
    console.error("S3 Upload error:", err);
    throw new Error(`Failed to upload file: ${err.message}`);
  }
};

export { uploadFile, client as s3Client };
