import React, { useState } from 'react';
import { Copy, Check as CheckIcon } from 'lucide-react';

interface SeoPreviewPanelProps {
  formData: any;
}

type Tab = 'google' | 'facebook' | 'twitter' | 'schema';

const SeoPreviewPanel: React.FC<SeoPreviewPanelProps> = ({ formData }) => {
  const [activeTab, setActiveTab] = useState<Tab>('google');
  const [copied, setCopied] = useState(false);

  const title = formData.meta_title || formData.name || 'Product Title';
  const description =
    formData.meta_description ||
    (formData.description || '').replace(/<[^>]*>/g, '').substring(0, 160) ||
    'Product description will appear here...';
  const slug = formData.slug || 'product-slug';
  const ogTitle = formData.meta_title || formData.name || 'Product Title';
  const ogDescription =
    formData.meta_description ||
    (formData.description || '').replace(/<[^>]*>/g, '').substring(0, 200) ||
    'Product description...';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'google', label: 'Google SERP' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'twitter', label: 'Twitter/X' },
    { id: 'schema', label: 'Schema.org' },
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@type': formData.format ? 'Book' : 'Product',
    name: formData.name || '',
    description: (formData.description || '').replace(/<[^>]*>/g, '').substring(0, 500),
    image: formData.images?.[0] ? URL.createObjectURL(formData.images[0]) : '',
    sku: formData.sku || '',
    brand: formData.author ? { '@type': 'Person', name: formData.author } : undefined,
    isbn: formData.isbn || undefined,
    offers: {
      '@type': 'Offer',
      price: formData.price || 0,
      priceCurrency: 'INR',
      availability: formData.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 bg-white">
        {activeTab === 'google' && (
          <div className="max-w-xl">
            <div className="text-lg font-normal text-blue-800 hover:underline cursor-pointer truncate">
              {title.length > 60 ? (
                <>
                  {title.substring(0, 60)}
                  <span className="text-red-500">{title.substring(60)}</span>
                </>
              ) : (
                title
              )}
            </div>
            <div className="text-sm text-green-700 truncate">
              www.bookbharat.com/products/{slug}
            </div>
            <div className="text-sm text-gray-600 mt-0.5">
              {description.length > 160 ? (
                <>
                  {description.substring(0, 160)}
                  <span className="text-red-500">{description.substring(160)}</span>
                </>
              ) : (
                description
              )}
            </div>
            {title.length > 60 && (
              <p className="text-xs text-red-500 mt-1">
                Title exceeds 60 characters — Google will truncate it
              </p>
            )}
            {description.length > 160 && (
              <p className="text-xs text-red-500 mt-1">
                Description exceeds 160 characters — Google will truncate it
              </p>
            )}
          </div>
        )}

        {activeTab === 'facebook' && (
          <div className="max-w-md border border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {formData.images?.[0] ? (
                <img
                  src={URL.createObjectURL(formData.images[0])}
                  alt="OG Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No image (1200x630 recommended)</span>
              )}
            </div>
            <div className="p-3 bg-gray-50">
              <p className="text-xs text-gray-500 uppercase">bookbharat.com</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5 uppercase">
                {ogTitle.length > 65 ? ogTitle.substring(0, 65) + '...' : ogTitle}
              </p>
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                {ogDescription.length > 200 ? ogDescription.substring(0, 200) + '...' : ogDescription}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'twitter' && (
          <div className="max-w-md border border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              {formData.images?.[0] ? (
                <img
                  src={URL.createObjectURL(formData.images[0])}
                  alt="Twitter Card"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-bold text-gray-900">
                {title.length > 70 ? title.substring(0, 70) + '...' : title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                {ogDescription.length > 200 ? ogDescription.substring(0, 200) + '...' : ogDescription}
              </p>
              <p className="text-xs text-gray-400 mt-1">bookbharat.com</p>
            </div>
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="relative">
            <button
              type="button"
              onClick={copySchema}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
            <pre className="text-xs text-gray-800 bg-gray-50 p-4 rounded-lg overflow-auto max-h-64">
              {JSON.stringify(schema, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeoPreviewPanel;
