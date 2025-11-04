import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Search, Home, BookOpen, AlertTriangle } from 'lucide-react';
import { api } from '../../api/axios';
import DocumentationNav from '../../components/Documentation/DocumentationNav';

interface DocSection {
  title: string;
  slug: string;
  icon: string;
  items: DocItem[];
}

interface DocItem {
  title: string;
  slug: string;
}

interface DocumentationData {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  metadata?: any;
}

const DynamicDocumentationPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch navigation structure
  const { data: navigationData } = useQuery({
    queryKey: ['documentation-navigation'],
    queryFn: async () => {
      const response = await api.get('/documentation/navigation');
      return response.data.data;
    },
  });

  // Fetch documentation content
  const { data: docData, isLoading, error } = useQuery({
    queryKey: ['documentation-page', slug],
    queryFn: async () => {
      if (!slug || slug === 'docs' || slug === 'quick-start') {
        // Return index page content
        return {
          data: {
            title: 'BookBharat Admin Documentation',
            content: getIndexContent(),
            category: 'Getting Started',
            excerpt: 'Complete guide to BookBharat admin panel'
          }
        };
      }
      const response = await api.get(`/documentation/${slug}`);
      return response.data;
    },
    enabled: !!slug,
  });

  // Search functionality
  const { data: searchResults } = useQuery({
    queryKey: ['documentation-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { data: [] };
      const response = await api.get(`/documentation/search?q=${encodeURIComponent(searchQuery)}`);
      return response.data;
    },
    enabled: searchQuery.length > 2,
  });

  const getIndexContent = () => {
    return `
      <div class="space-y-8">
        <!-- Header -->
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-4">BookBharat Admin Documentation</h1>
          <p class="text-lg text-gray-600">Complete guide to managing your e-commerce platform with BookBharat's powerful admin panel</p>
        </div>

        <!-- Quick Links Grid -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Quick Start Guides</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">🛒 Abandoned Cart Recovery</h3>
              <p class="text-gray-600 text-sm mb-3">Learn how to recover lost sales with our automated cart recovery system</p>
              <a href="/docs/abandoned-carts" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Read more →</a>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">📱 WhatsApp Integration</h3>
              <p class="text-gray-600 text-sm mb-3">Set up WhatsApp Business API for customer communication</p>
              <a href="/docs/whatsapp-integration" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Read more →</a>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">📊 Analytics Dashboard</h3>
              <p class="text-gray-600 text-sm mb-3">Understand your business metrics and performance indicators</p>
              <a href="/docs/recovery-analytics" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Read more →</a>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">💳 Payment Setup</h3>
              <p class="text-gray-600 text-sm mb-3">Configure payment gateways and manage transactions</p>
              <a href="/docs/payments" class="text-blue-600 hover:text-blue-800 text-sm font-medium">Read more →</a>
            </div>
          </div>
        </div>

        <!-- Key Features -->
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="flex items-start space-x-3">
              <div class="bg-blue-100 p-2 rounded-lg">
                ⚡
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-1">Automated Cart Recovery</h3>
                <p class="text-sm text-gray-600">Intelligent recovery system with ML-based customer segmentation</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="bg-green-100 p-2 rounded-lg">
                📧
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-1">Multi-Channel Communication</h3>
                <p class="text-sm text-gray-600">Reach customers via email, SMS, WhatsApp, and phone calls</p>
              </div>
            </div>
            <div class="flex items-start space-x-3">
              <div class="bg-purple-100 p-2 rounded-lg">
                📈
              </div>
              <div>
                <h3 class="font-semibold text-gray-900 mb-1">Advanced Analytics</h3>
                <p class="text-sm text-gray-600">Comprehensive analytics dashboard with recovery metrics</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Support -->
        <div class="bg-gray-50 rounded-lg p-8 text-center">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p class="text-gray-600 mb-6">Can't find what you're looking for? Our support team is here to help.</p>
          <button class="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    `;
  };

  const handleBackToAdmin = () => {
    navigate('/dashboard');
  };

  const renderContent = (content: string) => {
    // Simple HTML renderer - in production, you might want to use a proper markdown/HTML renderer
    return { __html: content };
  };

  if (isLoading && slug && slug !== 'docs') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Documentation Not Found</h1>
          <p className="text-gray-600 mb-6">The documentation page you're looking for doesn't exist.</p>
          <button
            onClick={handleBackToAdmin}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  const doc = docData?.data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBackToAdmin}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Back to Admin</span>
              </button>
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                <h1 className="text-xl font-semibold text-gray-900">Documentation</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />

                {/* Search Results Dropdown */}
                {searchQuery.length > 2 && searchResults?.data && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                    {searchResults.data.length > 0 ? (
                      searchResults.data.map((result: any) => (
                        <a
                          key={result.slug}
                          href={`/docs/${result.slug}`}
                          className="block px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="text-sm font-medium text-gray-900">{result.title}</div>
                          <div className="text-xs text-gray-500">{result.category}</div>
                        </a>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-8">
              <DocumentationNav />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-8 py-6">
                {doc && (
                  <>
                    <div className="mb-8">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{doc.title}</h1>
                      {doc.excerpt && (
                        <p className="text-lg text-gray-600">{doc.excerpt}</p>
                      )}
                    </div>

                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={renderContent(doc.content)}
                    />
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DynamicDocumentationPage;