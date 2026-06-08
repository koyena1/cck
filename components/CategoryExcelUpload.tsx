'use client';

import { useRef, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';

type CategoryExcelUploadProps = {
  category: string;
  label?: string;
  onUploaded: () => void | Promise<void>;
};

export default function CategoryExcelUpload({ category, label = 'Upload Excel', onUploaded }: CategoryExcelUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const sampleUrl = `/api/admin/category-bulk-upload?category=${encodeURIComponent(category)}`;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    setUploading(true);
    try {
      const response = await fetch('/api/admin/category-bulk-upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        const rowErrors = Array.isArray(data.errors) && data.errors.length > 0
          ? `\n\n${data.errors.slice(0, 10).join('\n')}`
          : '';
        alert(`Excel upload failed: ${data.error || 'Unknown error'}${rowErrors}`);
        return;
      }

      await onUploaded();
      alert(`Uploaded ${data.inserted} ${data.inserted === 1 ? 'product' : 'products'} successfully.`);
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      alert('Excel upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <a
        href={sampleUrl}
        className="bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700"
      >
        <Download className="w-5 h-5" />
        Sample Excel
      </a>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 disabled:bg-gray-400"
      >
        <FileSpreadsheet className="w-5 h-5" />
        {uploading ? 'Uploading...' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
