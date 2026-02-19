import { useState, useCallback, useRef } from 'react';
import { Upload, X, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { documentsApi } from '../lib/api';

interface DocumentUploadZoneProps {
  label: string;
  required?: boolean;
  documentType: string;
  orderId: string;
  onUploadComplete?: (document: unknown) => void;
  existingFile?: {
    id: string;
    fileName: string;
    mimeType: string;
  };
}

export function DocumentUploadZone({
  label,
  required,
  documentType,
  orderId,
  onUploadComplete,
  existingFile,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; fileName: string } | null>(
    existingFile ? { id: existingFile.id, fileName: existingFile.fileName } : null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const isImage = (mimeType: string) => mimeType.startsWith('image/');

  const handleUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Allowed: jpg, jpeg, png, pdf, heic');
      return;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('orderId', orderId);

    try {
      const response = await documentsApi.upload(formData);
      
      if (response.data.success && response.data.data) {
        setUploadedFile({
          id: response.data.data.id,
          fileName: response.data.data.fileName,
        });
        onUploadComplete?.(response.data.data);
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [documentType, orderId]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = async () => {
    if (uploadedFile?.id) {
      try {
        await documentsApi.delete(uploadedFile.id);
        setUploadedFile(null);
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  if (uploadedFile) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{uploadedFile.fileName}</p>
              <p className="text-sm text-gray-500">Uploaded successfully</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-full p-1 hover:bg-gray-200"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          uploading && 'pointer-events-none opacity-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf,.heic"
          onChange={handleFileSelect}
        />

        {uploading ? (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="mt-1 text-xs text-gray-500">JPG, PNG, PDF, HEIC (max 10MB)</p>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
