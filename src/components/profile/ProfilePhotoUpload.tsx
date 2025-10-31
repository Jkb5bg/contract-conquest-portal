'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button, Alert } from '@/components/ui';
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import writerApi from '@/lib/writerApi';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoUploaded: (url: string) => void;
  userType: 'writer' | 'client';
}

export default function ProfilePhotoUpload({
  currentPhotoUrl,
  onPhotoUploaded,
  userType,
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_type', userType);

      // Upload to backend - use appropriate API client based on user type
      const client = userType === 'writer' ? writerApi : apiClient;
      const endpoint = userType === 'writer' ? '/writer-auth/upload/profile-photo' : '/upload/profile-photo';

      const response = await client.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const photoUrl = response.data.url || response.data.profile_photo_url;
      onPhotoUploaded(photoUrl);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      // @ts-expect-error Accessing response property on unknown error type
      setError(err.response?.data?.detail || 'Failed to upload photo. Please try again.');
      setPreviewUrl(currentPhotoUrl || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      <div className="flex items-center gap-6">
        {/* Photo Preview */}
        <div className="relative w-32 h-32">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Profile preview"
              width={128}
              height={128}
              className="rounded-full object-cover border-2 border-gray-700"
              onError={() => setPreviewUrl(null)}
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
              <PhotoIcon className="w-12 h-12 text-gray-500" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <p className="text-sm text-gray-300 mb-2">
            Upload a profile photo (JPG, PNG, or GIF)
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Recommended size: 400x400px • Max file size: 5MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleButtonClick}
            disabled={isUploading}
            leftIcon={<ArrowUpTrayIcon className="w-4 h-4" />}
          >
            {isUploading ? 'Uploading...' : 'Choose Photo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
