import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../../api';
import {
  Star,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Eye,
  Trash2,
  Shield,
  User,
  Calendar,
  Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Review {
  id: number;
  user_id: number;
  product_id: number;
  order_id?: number;
  rating: number;
  title?: string;
  comment: string;
  is_verified: boolean;
  is_approved: boolean;
  helpful_count: number;
  not_helpful_count: number;
  admin_response?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
  };
  product?: {
    id: number;
    title: string;
    isbn: string;
    image_url?: string;
  };
}

interface FilterOptions {
  status: 'all' | 'pending' | 'approved' | 'rejected';
  rating: 'all' | '5' | '4' | '3' | '2' | '1';
  verified: 'all' | 'verified' | 'unverified';
  sortBy: 'latest' | 'oldest' | 'rating_high' | 'rating_low' | 'helpful';
}

const Reviews: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    rating: 'all',
    verified: 'all',
    sortBy: 'latest',
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch reviews
  const { data: reviewsResponse, isLoading } = useQuery({
    queryKey: ['reviews', currentPage, filters, searchTerm],
    queryFn: () => reviewsApi.getAll({
      page: currentPage,
      search: searchTerm,
      ...filters,
    }),
  });

  const reviews = reviewsResponse?.reviews?.data || [];
  const totalPages = reviewsResponse?.reviews?.last_page || 1;

  // Approve/Reject mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number; approved: boolean }) => {
      return reviewsApi.updateStatus(id, approved);
    },
    onSuccess: () => {
      toast.success('Review status updated');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update review');
    },
  });

  // Add response mutation
  const addResponseMutation = useMutation({
    mutationFn: async ({ id, response }: { id: number; response: string }) => {
      return reviewsApi.addResponse(id, response);
    },
    onSuccess: () => {
      toast.success('Response added successfully');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setShowResponseModal(false);
      setSelectedReview(null);
      setAdminResponse('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add response');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return reviewsApi.delete(id);
    },
    onSuccess: () => {
      toast.success('Review deleted');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    },
  });

  const handleApprove = (review: Review) => {
    updateStatusMutation.mutate({ id: review.id, approved: true });
  };

  const handleReject = (review: Review) => {
    updateStatusMutation.mutate({ id: review.id, approved: false });
  };

  const handleDelete = (review: Review) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      deleteMutation.mutate(review.id);
    }
  };

  const handleAddResponse = () => {
    if (!selectedReview || !adminResponse.trim()) {
      toast.error('Please enter a response');
      return;
    }
    addResponseMutation.mutate({ id: selectedReview.id, response: adminResponse });
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (review: Review) => {
    if (!review.is_approved) {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Pending
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Approved
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Product Reviews</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Total Reviews: {reviewsResponse?.reviews?.total || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select
            value={filters.verified}
            onChange={(e) => handleFilterChange('verified', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Reviews</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reviews.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {reviews.map((review: Review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {review.user?.avatar_url ? (
                      <img
                        src={review.user.avatar_url}
                        alt={review.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{review.user?.name}</p>
                          {review.is_verified && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              Verified Purchase
                            </span>
                          )}
                          {getStatusBadge(review)}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <div className="flex items-center gap-2">
                        {!review.is_approved && (
                          <>
                            <button
                              onClick={() => handleApprove(review)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(review)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedReview(review);
                            setAdminResponse(review.admin_response || '');
                            setShowResponseModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Add Response"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(review)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    {review.product && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded">
                        {review.product.image_url && (
                          <img
                            src={review.product.image_url}
                            alt={review.product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium">{review.product.title}</p>
                          <p className="text-xs text-gray-500">ISBN: {review.product.isbn}</p>
                        </div>
                      </div>
                    )}

                    {/* Review Title and Comment */}
                    {review.title && (
                      <h4 className="font-semibold mt-3">{review.title}</h4>
                    )}
                    <p className="text-gray-700 mt-2">{review.comment}</p>

                    {/* Admin Response */}
                    {review.admin_response && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-medium text-blue-900 mb-1">Store Response:</p>
                        <p className="text-sm text-blue-800">{review.admin_response}</p>
                      </div>
                    )}

                    {/* Helpful Votes */}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{review.helpful_count} found this helpful</span>
                      </div>
                      {review.not_helpful_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <ThumbsDown className="h-4 w-4" />
                          <span>{review.not_helpful_count}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">
              {selectedReview.admin_response ? 'Edit' : 'Add'} Store Response
            </h3>

            <div className="mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium text-sm">{selectedReview.user?.name}</p>
                  {renderStars(selectedReview.rating)}
                </div>
                <p className="text-sm text-gray-600">{selectedReview.comment}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Thank you for your feedback..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setSelectedReview(null);
                  setAdminResponse('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddResponse}
                disabled={addResponseMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {addResponseMutation.isPending ? 'Saving...' : 'Save Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;