import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Package,
  Truck,
  MapPin,
  DollarSign,
  Clock,
  Star,
  Shield,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Weight,
  Box,
  FileText,
  Download,
  Send,
  X
} from 'lucide-react';

interface CarrierRate {
  carrier_id: number;
  carrier_code: string;
  carrier_name: string;
  carrier_logo: string;
  service_code: string;
  service_name: string;
  base_charge: number;
  fuel_surcharge: number;
  gst: number;
  cod_charge: number;
  insurance_charge: number;
  other_charges: number;
  total_charge: number;
  original_charge?: number;
  discount?: number;
  delivery_days: number;
  expected_delivery_date: string;
  features: string[];
  tracking_available: boolean;
  rating: number;
  success_rate: number;
  ranking_score: number;
  is_cheapest: boolean;
  is_fastest: boolean;
  is_free_shipping?: boolean;
  has_discount?: boolean;
  recommendation_reason?: string;
}

interface ShipmentDetails {
  pickup_pincode: string;
  delivery_pincode: string;
  weight: number;
  volumetric_weight: number;
  billable_weight: number;
  order_value: number;
  payment_mode: string;
  cod_amount: number;
  is_fragile: boolean;
  is_valuable: boolean;
  requires_insurance: boolean;
}

const CreateShipment: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [selectedCarrier, setSelectedCarrier] = useState<CarrierRate | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: null as number | null,
    maxDays: null as number | null,
    features: [] as string[],
    carrierTypes: [] as string[]
  });
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'rating' | 'recommended'>('recommended');
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonCarriers, setComparisonCarriers] = useState<CarrierRate[]>([]);

  // Fetch order details
  const { data: orderResponse, isLoading: orderLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    }
  });

  const order = orderResponse?.order;

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/warehouses');
      return response.data?.data || response.data || [];
    }
  });

  const warehouses = warehousesData || [];

  // Fetch carrier-specific warehouse mappings when carrier is selected
  const { data: carrierWarehousesData } = useQuery({
    queryKey: ['carrier-warehouses', selectedCarrier?.carrier_id],
    queryFn: async () => {
      if (!selectedCarrier?.carrier_id) return [];
      const response = await api.get(`/shipping/multi-carrier/carriers/${selectedCarrier.carrier_id}/warehouses`);
      return response.data?.data || response.data || [];
    },
    enabled: !!selectedCarrier
  });

  const carrierWarehouses = carrierWarehousesData || [];

  // Auto-select warehouse when carrier is selected
  React.useEffect(() => {
    if (selectedCarrier && !selectedWarehouse && carrierWarehouses.length > 0) {
      // First priority: registered warehouses (carrier-approved pickup locations)
      const registeredWarehouses = carrierWarehouses.filter((w: any) => w.is_registered);
      if (registeredWarehouses.length > 0) {
        // Auto-select the first registered warehouse (typically the only one)
        setSelectedWarehouse(registeredWarehouses[0].id || registeredWarehouses[0].name);
        return;
      }

      // Second priority: default site warehouse
      const defaultWh = carrierWarehouses.find((w: any) => w.is_default);
      if (defaultWh) {
        setSelectedWarehouse(defaultWh.id || defaultWh.name);
        return;
      }

      // Third priority: if only one warehouse available, select it
      if (carrierWarehouses.length === 1) {
        setSelectedWarehouse(carrierWarehouses[0].id || carrierWarehouses[0].name);
      }
    }
  }, [selectedCarrier, carrierWarehouses, selectedWarehouse]);

  // Fetch pickup location configuration (fallback)
  const { data: pickupLocation } = useQuery({
    queryKey: ['pickup-location'],
    queryFn: async () => {
      const response = await api.get('/shipping/multi-carrier/pickup-location');
      return response.data.data;
    }
  });

  // Fetch shipping rates
  const { data: ratesData, isLoading: ratesLoading, refetch: refetchRates } = useQuery({
    queryKey: ['shipping-rates', orderId],
    queryFn: async () => {
      if (!order) return null;

      // Ensure required fields are present
      const deliveryPincode = order.shipping_address?.pincode || order.delivery_pincode;
      const orderValue = order.total_amount;

      if (!deliveryPincode || !orderValue) {
        console.error('Missing required fields:', { deliveryPincode, orderValue, order });
        throw new Error('Missing required shipping information');
      }

      const response = await api.post('/shipping/multi-carrier/rates/compare', {
        order_id: orderId,
        pickup_pincode: pickupLocation?.pincode || '110001',
        delivery_pincode: deliveryPincode,
        weight: calculateOrderWeight() || 1,
        order_value: parseFloat(orderValue),
        payment_mode: order.payment_method === 'cod' ? 'cod' : 'prepaid',
        cod_amount: order.payment_method === 'cod' ? parseFloat(orderValue) : 0,
        items: order.order_items?.map((item: any) => ({
          product_id: item.product_id,
          name: item.product_name,
          weight: parseFloat(item.product?.weight || '0.5'),
          quantity: item.quantity,
          value: parseFloat(item.unit_price)
        }))
      });
      // Backend returns { success, message, data }
      // We need to return data.data to get the actual rates
      return response.data?.data || response.data;
    },
    enabled: !!order && !!pickupLocation,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/shipping/multi-carrier/create', data);
    },
    onSuccess: () => {
      toast.success('Shipment created successfully!');
      navigate(`/orders/${orderId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    }
  });

  // Calculate total order weight
  const calculateOrderWeight = () => {
    if (!order?.order_items) return 1;
    return order.order_items.reduce((total: number, item: any) => {
      const weight = parseFloat(item.product?.weight || '0.5');
      return total + (weight * item.quantity);
    }, 0);
  };

  // Filter and sort carriers
  const getFilteredAndSortedCarriers = () => {
    if (!ratesData?.rates) return [];

    let filtered = [...ratesData.rates];

    // Apply filters
    if (filters.maxPrice !== null) {
      const maxPrice = filters.maxPrice;
      filtered = filtered.filter(c => c.total_charge <= maxPrice);
    }
    if (filters.maxDays !== null) {
      const maxDays = filters.maxDays;
      filtered = filtered.filter(c => c.delivery_days <= maxDays);
    }
    if (filters.features.length > 0) {
      filtered = filtered.filter(c =>
        filters.features.every(f => c.features.includes(f))
      );
    }
    if (filters.carrierTypes.length > 0) {
      filtered = filtered.filter(c =>
        filters.carrierTypes.includes(c.carrier_code)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price':
        return filtered.sort((a, b) => a.total_charge - b.total_charge);
      case 'time':
        return filtered.sort((a, b) => a.delivery_days - b.delivery_days);
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'recommended':
      default:
        return filtered.sort((a, b) => b.ranking_score - a.ranking_score);
    }
  };

  // Handle carrier selection
  const handleCarrierSelect = (carrier: CarrierRate) => {
    setSelectedCarrier(carrier);
  };

  // Add to comparison
  const handleAddToComparison = (carrier: CarrierRate) => {
    if (comparisonCarriers.length >= 3) {
      toast.error('You can compare up to 3 carriers at a time');
      return;
    }
    if (comparisonCarriers.find(c => c.carrier_id === carrier.carrier_id && c.service_code === carrier.service_code)) {
      toast.error('This carrier service is already in comparison');
      return;
    }
    setComparisonCarriers([...comparisonCarriers, carrier]);
    setShowComparison(true);
  };

  // Remove from comparison
  const handleRemoveFromComparison = (carrier: CarrierRate) => {
    setComparisonCarriers(comparisonCarriers.filter(c =>
      !(c.carrier_id === carrier.carrier_id && c.service_code === carrier.service_code)
    ));
  };

  // Create shipment
  const handleCreateShipment = () => {
    if (!selectedCarrier) {
      toast.error('Please select a carrier');
      return;
    }

    if (!selectedWarehouse) {
      toast.error('Please select a pickup warehouse');
      return;
    }

    const shipmentData = {
      order_id: orderId,
      carrier_id: selectedCarrier.carrier_id,
      service_code: selectedCarrier.service_code,
      shipping_cost: selectedCarrier.total_charge,
      expected_delivery_date: selectedCarrier.expected_delivery_date,
      warehouse_id: selectedWarehouse,
      schedule_pickup: true
    };

    createShipmentMutation.mutate(shipmentData);
  };

  const carriers = getFilteredAndSortedCarriers();
  const recommended = ratesData?.recommended;

  if (orderLoading || ratesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Shipment</h1>
        <p className="text-gray-600">Order #{order?.order_number}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Order Details</h2>

            {/* Addresses */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  Pickup
                </div>
                <p className="text-sm">
                  {pickupLocation?.name || 'BookBharat Warehouse'}<br />
                  {pickupLocation?.address && <>{pickupLocation.address}<br /></>}
                  {pickupLocation?.city && pickupLocation?.state &&
                    <>{pickupLocation.city}, {pickupLocation.state}<br /></>
                  }
                  {pickupLocation?.pincode || '110001'}
                </p>
              </div>

              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  Delivery
                </div>
                <p className="text-sm">
                  {order?.shipping_address?.first_name} {order?.shipping_address?.last_name}<br />
                  {order?.shipping_address?.address_line_1}<br />
                  {order?.shipping_address?.city}, {order?.shipping_address?.state}<br />
                  {order?.shipping_address?.pincode}
                </p>
              </div>
            </div>

            {/* Package Details */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Package Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span>{order?.order_items?.length || 0} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Weight</span>
                  <span>{ratesData?.shipment_details?.billable_weight || 0} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Value</span>
                  <span>₹{order?.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment</span>
                  <span className="uppercase">{order?.payment_method}</span>
                </div>
              </div>
            </div>

            {/* Selected Carrier */}
            {selectedCarrier && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-4">
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">Selected Carrier</h3>
                  <div className="text-sm">
                    <p className="font-medium">{selectedCarrier.carrier_name}</p>
                    <p className="text-gray-600">{selectedCarrier.service_name}</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      ₹{selectedCarrier.total_charge}
                    </p>
                  </div>
                </div>

                {/* Warehouse Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Pickup Warehouse
                  </label>
                  {carrierWarehouses.length > 0 ? (
                    <select
                      value={selectedWarehouse || ''}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select warehouse...</option>
                      {carrierWarehouses.map((wh: any) => (
                        <option key={wh.id || wh.name} value={wh.id || wh.name}>
                          {wh.name}
                          {wh.carrier_warehouse_name && wh.carrier_warehouse_name !== wh.name && ` → ${wh.carrier_warehouse_name}`}
                          {wh.is_registered && ' (Registered)'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-2 border border-gray-200">
                      <Info className="h-4 w-4 inline mr-1" />
                      Loading warehouses...
                    </div>
                  )}
                  {selectedWarehouse && carrierWarehouses.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      {(() => {
                        const wh = carrierWarehouses.find((w: any) => (w.id || w.name) === selectedWarehouse);
                        return wh ? (
                          <div className="bg-white rounded-md p-2 border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{wh.name}</p>
                              {wh.is_registered && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Carrier Registered
                                </span>
                              )}
                            </div>
                            {wh.carrier_warehouse_name && wh.carrier_warehouse_name !== wh.name && (
                              <p className="text-blue-600 text-sm">Carrier Alias: {wh.carrier_warehouse_name}</p>
                            )}
                            {(wh.address || wh.city) && (
                              <p className="text-sm text-gray-600">
                                {wh.address && `${wh.address}, `}
                                {wh.city && `${wh.city}`}
                                {wh.pincode && ` - ${wh.pincode}`}
                              </p>
                            )}
                            {wh.phone && (
                              <p className="text-sm text-gray-600">Phone: {wh.phone}</p>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCreateShipment}
                  disabled={createShipmentMutation.isPending || !selectedWarehouse}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
                >
                  {createShipmentMutation.isPending ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Shipment
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Carrier Options */}
        <div className="lg:col-span-2">
          {/* Filters and Sorting */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price">Price: Low to High</option>
                  <option value="time">Delivery Time</option>
                  <option value="rating">Rating</option>
                </select>
              </div>

              <button
                onClick={() => refetchRates()}
                className="flex items-center px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Rates
              </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="border-t pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Max Price (₹)</label>
                  <input
                    type="number"
                    value={filters.maxPrice || ''}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : null })}
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded"
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Max Days</label>
                  <input
                    type="number"
                    value={filters.maxDays || ''}
                    onChange={(e) => setFilters({ ...filters, maxDays: e.target.value ? Number(e.target.value) : null })}
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded"
                    placeholder="Any"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Features</label>
                  <div className="mt-1 space-y-1">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.features.includes('tracking')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({ ...filters, features: [...filters.features, 'tracking'] });
                          } else {
                            setFilters({ ...filters, features: filters.features.filter(f => f !== 'tracking') });
                          }
                        }}
                        className="mr-2"
                      />
                      Tracking
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.features.includes('insurance')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({ ...filters, features: [...filters.features, 'insurance'] });
                          } else {
                            setFilters({ ...filters, features: filters.features.filter(f => f !== 'insurance') });
                          }
                        }}
                        className="mr-2"
                      />
                      Insurance
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Actions</label>
                  <button
                    onClick={() => setFilters({ maxPrice: null, maxDays: null, features: [], carrierTypes: [] })}
                    className="mt-1 w-full px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {ratesData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Options Available</p>
                <p className="text-2xl font-bold">{ratesData.summary.available_options}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Price Range</p>
                <p className="text-lg font-semibold">
                  ₹{ratesData.summary.price_range.min} - ₹{ratesData.summary.price_range.max}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Delivery Range</p>
                <p className="text-lg font-semibold">
                  {ratesData.summary.delivery_range.min}-{ratesData.summary.delivery_range.max} days
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold">₹{ratesData.summary.average_price}</p>
              </div>
            </div>
          )}

          {/* Recommended Option */}
          {recommended && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold text-blue-900">Recommended Option</span>
                </div>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  Best Value
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  {recommended.carrier_logo && (
                    <img src={recommended.carrier_logo} alt={recommended.carrier_name} className="h-8 w-auto mr-3" />
                  )}
                  <div>
                    <p className="font-medium">{recommended.carrier_name}</p>
                    <p className="text-sm text-gray-600">{recommended.service_name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">₹{recommended.total_charge}</p>
                    {recommended.has_discount && (
                      <p className="text-sm text-gray-500 line-through">₹{recommended.original_charge}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleCarrierSelect(recommended)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleAddToComparison(recommended)}
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
                  >
                    Compare
                  </button>
                </div>
              </div>

              {recommended.recommendation_reason && (
                <p className="text-sm text-gray-600 mt-2">
                  <Info className="h-4 w-4 inline mr-1" />
                  {recommended.recommendation_reason}
                </p>
              )}
            </div>
          )}

          {/* Carrier List */}
          <div className="space-y-4">
            {carriers.map((carrier, index) => (
              <div
                key={`${carrier.carrier_id}-${carrier.service_code}-${index}`}
                className={`bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow ${
                  selectedCarrier?.carrier_id === carrier.carrier_id &&
                  selectedCarrier?.service_code === carrier.service_code
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Carrier Info */}
                  <div className="flex items-center">
                    {carrier.carrier_logo && (
                      <img src={carrier.carrier_logo} alt={carrier.carrier_name} className="h-10 w-auto mr-3" />
                    )}
                    <div>
                      <p className="font-semibold">{carrier.carrier_name}</p>
                      <p className="text-sm text-gray-600">{carrier.service_name}</p>
                      <div className="flex items-center mt-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm ml-1">{carrier.rating}</span>
                        <span className="text-xs text-gray-500 ml-2">({carrier.success_rate}% success)</span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        ₹{carrier.total_charge}
                      </p>
                      {carrier.has_discount && (
                        <>
                          <p className="text-sm text-gray-500 line-through">₹{carrier.original_charge}</p>
                          <p className="text-xs text-green-600">Save ₹{carrier.discount}</p>
                        </>
                      )}
                      {carrier.is_free_shipping && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Free Shipping
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="font-medium">{carrier.delivery_days} days</span>
                      </div>
                      {carrier.expected_delivery_date && (
                        <p className="text-xs text-gray-500">
                          By {new Date(carrier.expected_delivery_date).toLocaleDateString()}
                        </p>
                      )}
                      {carrier.is_fastest && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full mt-1 inline-block">
                          <Zap className="h-3 w-3 inline mr-1" />
                          Fastest
                        </span>
                      )}
                      {carrier.is_cheapest && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full mt-1 inline-block">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          Cheapest
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleCarrierSelect(carrier)}
                      className={`px-4 py-2 rounded-md ${
                        selectedCarrier?.carrier_id === carrier.carrier_id &&
                        selectedCarrier?.service_code === carrier.service_code
                          ? 'bg-green-600 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {selectedCarrier?.carrier_id === carrier.carrier_id &&
                       selectedCarrier?.service_code === carrier.service_code ? (
                        <>
                          <CheckCircle className="h-4 w-4 inline mr-1" />
                          Selected
                        </>
                      ) : (
                        'Select'
                      )}
                    </button>
                    <button
                      onClick={() => handleAddToComparison(carrier)}
                      className="p-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50"
                      title="Add to comparison"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Features */}
                {carrier.features && carrier.features.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-4">
                    <span className="text-sm text-gray-600">Features:</span>
                    <div className="flex flex-wrap gap-2">
                      {carrier.features.map((feature: string, idx: number) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {carriers.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No carriers available for this route</p>
              <button
                onClick={() => refetchRates()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Modal */}
      {showComparison && comparisonCarriers.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Compare Carriers</h2>
                <button
                  onClick={() => setShowComparison(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Feature</th>
                      {comparisonCarriers.map((carrier, idx) => (
                        <th key={idx} className="text-center p-2">
                          <div>
                            <p className="font-medium">{carrier.carrier_name}</p>
                            <p className="text-sm text-gray-600">{carrier.service_name}</p>
                            <button
                              onClick={() => handleRemoveFromComparison(carrier)}
                              className="text-xs text-red-600 hover:text-red-800 mt-1"
                            >
                              Remove
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Price</td>
                      {comparisonCarriers.map((carrier, idx) => (
                        <td key={idx} className="text-center p-2">
                          <p className="text-lg font-bold">₹{carrier.total_charge}</p>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Delivery Time</td>
                      {comparisonCarriers.map((carrier, idx) => (
                        <td key={idx} className="text-center p-2">
                          {carrier.delivery_days} days
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Rating</td>
                      {comparisonCarriers.map((carrier, idx) => (
                        <td key={idx} className="text-center p-2">
                          <div className="flex items-center justify-center">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="ml-1">{carrier.rating}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Success Rate</td>
                      {comparisonCarriers.map((carrier, idx) => (
                        <td key={idx} className="text-center p-2">
                          {carrier.success_rate}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2"></td>
                      {comparisonCarriers.map((carrier, idx) => (
                        <td key={idx} className="text-center p-2">
                          <button
                            onClick={() => {
                              handleCarrierSelect(carrier);
                              setShowComparison(false);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Select
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateShipment;