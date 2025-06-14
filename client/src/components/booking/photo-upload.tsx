import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Camera } from 'lucide-react';

interface PhotoUploadProps {
  onPhotoSelect: (file: File | null) => void;
  photo: File | null;
  photoPreview: string | null;
}

export default function PhotoUpload({ onPhotoSelect, photo, photoPreview }: PhotoUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onPhotoSelect(acceptedFiles[0]);
    }
  }, [onPhotoSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemovePhoto = () => {
    onPhotoSelect(null);
  };

  if (photoPreview) {
    return (
      <Card className="relative">
        <CardContent className="p-6">
          <div className="relative">
            <img 
              src={photoPreview} 
              alt="Room preview" 
              className="w-full h-64 object-cover rounded-xl"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemovePhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-success mt-2 text-center">
            ✓ Photo uploaded successfully!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      {...getRootProps()} 
      className={`cursor-pointer border-2 border-dashed transition-colors ${
        isDragActive 
          ? 'border-primary bg-blue-50' 
          : 'border-gray-300 hover:border-primary'
      }`}
    >
      <CardContent className="p-8">
        <input {...getInputProps()} />
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isDragActive ? (
              <Upload className="h-8 w-8 text-primary" />
            ) : (
              <Camera className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragActive ? 'Drop your photo here' : 'Upload Room Photo'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isDragActive 
              ? 'Release to upload' 
              : 'Click to upload or drag and drop'
            }
          </p>
          <p className="text-sm text-gray-500">
            PNG, JPG up to 10MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
