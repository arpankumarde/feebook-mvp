import { useState } from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";
import { CheckCircleIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";

export interface FileUploadProps {
  label: string;
  description: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  icon: React.ReactNode;
  required?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  accept,
  file,
  onFileChange,
  icon,
  required = false,
}) => {
  const [fileError, setFileError] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;

    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      const fileExtension = selectedFile.name.toLowerCase().split(".").pop();
      const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];

      if (
        !allowedTypes.includes(selectedFile.type) &&
        !allowedExtensions.includes(fileExtension || "")
      ) {
        setFileError("Please select a valid file format (PDF, JPG, JPEG, PNG)");
        event.target.value = ""; // Clear the input
        return;
      }

      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setFileError("File size must be less than 10MB");
        event.target.value = ""; // Clear the input
        return;
      }

      setFileError("");
    }

    onFileChange(selectedFile);
  };

  const handleRemoveFile = () => {
    setFileError("");
    onFileChange(null);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <p className="text-xs text-muted-foreground">{description}</p>

      {!file ? (
        <div className="space-y-2">
          <Input
            type="file"
            accept="application/pdf,image/jpeg,image/jpg,image/png,.pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="cursor-pointer font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Supported formats: PDF, JPG, JPEG, PNG (Max 10MB)
          </p>
          {fileError && <p className="text-xs text-destructive">{fileError}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <CheckCircleIcon
              size={20}
              className="text-green-600"
              weight="fill"
            />
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="text-destructive hover:text-destructive"
          >
            <TrashIcon size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
