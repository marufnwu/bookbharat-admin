import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../api/axios";
import toast from "react-hot-toast";
import {
  Package,
  Truck,
  MapPin,
  DollarSign,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  Send,
  ArrowLeft,
  MoreVertical,
  X,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatusBadge,
  Skeleton,
  PageSkeleton,
} from "../../components";

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

const CreateShipment: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [selectedCarrier, setSelectedCarrier] = useState<CarrierRate | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "time" | "rating" | "recommended">("recommended");
  const [filterPreset, setFilterPreset] = useState<"all" | "budget" | "fast" | "premium">("all");

  // Fetch order details
  const { data: orderResponse, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    },
  });

  const order = orderResponse?.order;

  // Fetch pickup location
  const { data: pickupLocation } = useQuery({
    queryKey: ["pickup-location"],
    queryFn: async () => {
      const response = await api.get("/shipping/multi-carrier/pickup-location");
      return response.data.data;
    },
  });

  // Fetch carrier warehouses when carrier is selected
  const { data: carrierWarehousesResponse, isLoading: warehousesLoading } = useQuery({
    queryKey: ["carrier-warehouses", selectedCarrier?.carrier_id],
    queryFn: async () => {
      if (!selectedCarrier?.carrier_id) return null;
      const response = await api.get(
        `/shipping/multi-carrier/carriers/${selectedCarrier.carrier_id}/warehouses`
      );
      return response.data || null;
    },
    enabled: !!selectedCarrier,
  });

  const carrierWarehouses = carrierWarehousesResponse?.data || [];
  const warehouseMetadata = {
    requirementType: carrierWarehousesResponse?.requirement_type,
    source: carrierWarehousesResponse?.source,
    note: carrierWarehousesResponse?.note,
  };

  // Auto-select warehouse
  useEffect(() => {
    if (selectedCarrier && !selectedWarehouse && carrierWarehouses.length > 0) {
      const registeredWarehouses = carrierWarehouses.filter((w: any) => w.is_registered);
      if (registeredWarehouses.length > 0) {
        setSelectedWarehouse(registeredWarehouses[0].id || registeredWarehouses[0].name);
        return;
      }
      const defaultWh = carrierWarehouses.find((w: any) => w.is_default);
      if (defaultWh) {
        setSelectedWarehouse(defaultWh.id || defaultWh.name);
      } else if (carrierWarehouses.length === 1) {
        setSelectedWarehouse(carrierWarehouses[0].id || carrierWarehouses[0].name);
      }
    }
  }, [selectedCarrier, carrierWarehouses, selectedWarehouse]);

  // Fetch shipping rates
  const {
    data: ratesData,
    isLoading: ratesLoading,
    refetch: refetchRates,
  } = useQuery({
    queryKey: ["shipping-rates", orderId],
    queryFn: async () => {
      if (!order) return null;
      const deliveryPincode = order.shipping_address?.pincode || order.delivery_pincode;
      const orderValue = order.total_amount;

      if (!deliveryPincode || !orderValue) {
        throw new Error("Missing required shipping information");
      }

      const response = await api.post("/shipping/multi-carrier/rates/compare", {
        order_id: orderId,
        pickup_pincode: pickupLocation?.pincode || "110001",
        delivery_pincode: deliveryPincode,
        weight: calculateOrderWeight() || 1,
        order_value: parseFloat(orderValue),
        payment_mode: order.payment_method === "cod" ? "cod" : "prepaid",
        cod_amount: order.payment_method === "cod" ? parseFloat(orderValue) : 0,
        items: order.order_items?.map((item: any) => ({
          product_id: item.product_id,
          name: item.product_name,
          weight: parseFloat(item.product?.weight || "0.5"),
          quantity: item.quantity,
          value: parseFloat(item.unit_price),
        })),
      });
      return response.data?.data || response.data;
    },
    enabled: !!order && !!pickupLocation,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post("/shipping/multi-carrier/create", data);
    },
    onSuccess: () => {
      toast.success("Shipment created successfully!");
      navigate(`/orders/${orderId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create shipment");
    },
  });

  const calculateOrderWeight = () => {
    if (!order?.order_items) return 1;
    return order.order_items.reduce((total: number, item: any) => {
      const weight = parseFloat(item.product?.weight || "0.5");
      return total + weight * item.quantity;
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter and sort carriers
  const getFilteredCarriers = () => {
    if (!ratesData?.rates) return [];
    let carriers = [...ratesData.rates];

    // Apply preset filters
    if (filterPreset === "budget") {
      carriers = carriers.sort((a, b) => a.total_charge - b.total_charge);
    } else if (filterPreset === "fast") {
      carriers = carriers.sort((a, b) => a.delivery_days - b.delivery_days);
    } else if (filterPreset === "premium") {
      carriers = carriers.filter((c) => c.rating >= 4.0 && c.success_rate >= 95);
    }

    // Apply sorting
    if (sortBy === "price") {
      carriers.sort((a, b) => a.total_charge - b.total_charge);
    } else if (sortBy === "time") {
      carriers.sort((a, b) => a.delivery_days - b.delivery_days);
    } else if (sortBy === "rating") {
      carriers.sort((a, b) => b.rating - a.rating);
    } else {
      carriers.sort((a, b) => b.ranking_score - a.ranking_score);
    }

    return carriers;
  };

  const carriers = getFilteredCarriers();
  const recommended = carriers.find((c) => c.ranking_score === Math.max(...carriers.map((c) => c.ranking_score)));

  const handleCarrierSelect = (carrier: CarrierRate) => {
    if (
      selectedCarrier?.carrier_id === carrier.carrier_id &&
      selectedCarrier?.service_code === carrier.service_code
    ) {
      setSelectedCarrier(null);
      setSelectedWarehouse(null);
    } else {
      setSelectedCarrier(carrier);
    }
  };

  const handleCreateShipment = () => {
    if (!selectedCarrier) {
      toast.error("Please select a carrier");
      return;
    }
    if (!selectedWarehouse) {
      toast.error("Please select a pickup warehouse");
      return;
    }

    createShipmentMutation.mutate({
      order_id: orderId,
      carrier_id: selectedCarrier.carrier_id,
      service_code: selectedCarrier.service_code,
      warehouse_id: selectedWarehouse,
    });
  };

  // Loading state
  if (orderLoading) {
    return <PageSkeleton type="detail" />;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Package className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Order not found</h3>
        <Button variant="outline" onClick={() => navigate("/orders")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
      <div className="max-w-7xl mx-auto space-y-3 md:space-y-6 p-3 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 bg-white p-3 md:p-4 rounded-lg shadow-sm border sticky top-0 z-40">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/orders/${orderId}`)}
              className="hidden sm:flex"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/orders/${orderId}`)}
              className="sm:hidden p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">Create Shipment</h1>
              <p className="text-xs md:text-sm text-gray-500">Order #{order.order_number}</p>
            </div>
          </div>
        </div>

        {/* Mobile Order Summary - Collapsible */}
        <div className="lg:hidden bg-white rounded-lg shadow-sm border overflow-hidden">
          <details className="group" open>
            <summary className="flex items-center justify-between p-3 cursor-pointer list-none bg-gray-50">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Order Summary</p>
                <p className="text-xs text-gray-500">
                  {order.order_items?.length || 0} items • {formatCurrency(order.total_amount)}
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="p-3 border-t space-y-2 text-sm">
            {/* Route Info */}
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="w-0.5 h-6 bg-gray-200" />
                <MapPin className="h-3 w-3 text-green-500" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-gray-400">From</p>
                  <p className="font-medium text-xs">{pickupLocation?.name || "Warehouse"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">To</p>
                  <p className="font-medium text-xs">{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                </div>
              </div>
              <Badge variant={order.payment_method === "cod" ? "warning" : "success"} className="text-xs">
                {order.payment_method === "cod" ? "COD" : "PREPAID"}
              </Badge>
            </div>
          </div>
        </details>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Desktop Order Summary Sidebar */}
        <div className="hidden lg:block">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route Visualization */}
              <div className="relative pl-4 border-l-2 border-dashed border-gray-200 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[23px] top-0 h-6 w-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-xs text-gray-400 uppercase font-medium">Pickup From</p>
                  <p className="text-sm font-medium">{pickupLocation?.name || "BookBharat Warehouse"}</p>
                  <p className="text-sm text-gray-500">{pickupLocation?.pincode || "110001"}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[23px] top-0 h-6 w-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                    <MapPin className="h-3 w-3 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-400 uppercase font-medium">Deliver To</p>
                  <p className="text-sm font-medium">
                    {order.shipping_address?.name || order.customer_name || "Customer"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.shipping_address?.city}, {order.shipping_address?.state}{" "}
                    {order.shipping_address?.pincode}
                  </p>
                </div>
              </div>

              {/* Package Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items</span>
                  <span className="font-medium">{order.order_items?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Weight</span>
                  <span className="font-medium">{ratesData?.shipment_details?.billable_weight || calculateOrderWeight().toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Value</span>
                  <span className="font-medium">{formatCurrency(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-gray-500">Payment</span>
                  <Badge variant={order.payment_method === "cod" ? "warning" : "success"}>
                    {order.payment_method === "cod" ? "COD" : "PREPAID"}
                  </Badge>
                </div>
              </div>

              {/* Selected Carrier */}
              {selectedCarrier && (
                <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-blue-900">Selected Carrier</p>
                    <button
                      onClick={() => {
                        setSelectedCarrier(null);
                        setSelectedWarehouse(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium">{selectedCarrier.carrier_name}</p>
                    <p className="text-sm text-gray-600">{selectedCarrier.service_name}</p>
                    <p className="text-lg font-bold text-blue-600 mt-1">
                      {formatCurrency(selectedCarrier.total_charge)}
                    </p>
                  </div>

                  {/* Warehouse Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Pickup Warehouse</label>
                    {warehousesLoading ? (
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                        Loading...
                      </div>
                    ) : carrierWarehouses.length > 0 ? (
                      <select
                        value={selectedWarehouse || ""}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select warehouse</option>
                        {carrierWarehouses.map((wh: any) => (
                          <option key={wh.id || wh.name} value={wh.id || wh.name}>
                            {wh.name} {wh.is_registered && "✓"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        No warehouses available
                      </p>
                    )}
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleCreateShipment}
                    disabled={createShipmentMutation.isPending || !selectedWarehouse}
                    loading={createShipmentMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Create Shipment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carrier Options */}
        <div className="lg:col-span-2 space-y-3">
          {/* Quick Filters - Mobile Friendly */}
          <div className="bg-white rounded-lg shadow-sm border p-2 md:p-4">
            <div className="flex flex-col gap-2">
              {/* Filter buttons row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 md:mx-0 md:px-0 md:flex-wrap md:gap-2">
                {[
                  { value: "all", label: "All", icon: Filter },
                  { value: "budget", label: "Budget", icon: DollarSign },
                  { value: "fast", label: "Fast", icon: Zap },
                  { value: "premium", label: "Premium", icon: Award },
                ].map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.value}
                      onClick={() => setFilterPreset(preset.value as any)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                        filterPreset === preset.value
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 active:bg-gray-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
              {/* Sort and refresh row */}
              <div className="flex items-center justify-between gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="recommended">Sort: Recommended</option>
                  <option value="price">Sort: Price</option>
                  <option value="time">Sort: Delivery</option>
                  <option value="rating">Sort: Rating</option>
                </select>
                <button
                  onClick={() => refetchRates()}
                  className="p-2 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-md border border-gray-200"
                  title="Refresh rates"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          {ratesData?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
                <p className="text-xs text-gray-500">Options</p>
                <p className="text-xl font-bold">{ratesData.summary.available_options}</p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
                <p className="text-xs text-gray-500">Price Range</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(ratesData.summary.price_range.min)} -{" "}
                  {formatCurrency(ratesData.summary.price_range.max)}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
                <p className="text-xs text-gray-500">Delivery</p>
                <p className="text-sm font-semibold">
                  {ratesData.summary.delivery_range.min}-{ratesData.summary.delivery_range.max} days
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm border text-center">
                <p className="text-xs text-gray-500">Avg Price</p>
                <p className="text-xl font-bold">{formatCurrency(ratesData.summary.average_price)}</p>
              </div>
            </div>
          )}

          {/* Recommended Option */}
          {recommended && (
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-5 w-5" />
                <span className="font-bold">Recommended</span>
                <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full">BEST CHOICE</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                    {recommended.carrier_logo ? (
                      <img src={recommended.carrier_logo} alt="" className="max-h-8 max-w-8 object-contain" />
                    ) : (
                      <Truck className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{recommended.carrier_name}</p>
                    <p className="text-sm text-white/80">{recommended.service_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{formatCurrency(recommended.total_charge)}</p>
                    <p className="text-xs text-white/80">{recommended.delivery_days} days</p>
                  </div>
                  <button
                    onClick={() => handleCarrierSelect(recommended)}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Carrier List */}
          <div className="space-y-3">
            {ratesLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            )}
            {carriers.map((carrier, index) => (
              <div
                key={`${carrier.carrier_id}-${carrier.service_code}-${index}`}
                className={`bg-white rounded-lg border p-4 transition-all ${
                  selectedCarrier?.carrier_id === carrier.carrier_id &&
                  selectedCarrier?.service_code === carrier.service_code
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Carrier Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 bg-gray-50 rounded-lg border flex items-center justify-center flex-shrink-0">
                      {carrier.carrier_logo ? (
                        <img src={carrier.carrier_logo} alt="" className="max-h-8 max-w-8 object-contain" />
                      ) : (
                        <Truck className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{carrier.carrier_name}</p>
                      <p className="text-sm text-gray-500 truncate">{carrier.service_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center text-yellow-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-xs ml-1">{carrier.rating}</span>
                        </div>
                        <span className="text-xs text-gray-400">{carrier.success_rate}% success</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Delivery */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(carrier.total_charge)}</p>
                      {carrier.has_discount && (
                        <p className="text-xs text-green-600">Save {formatCurrency(carrier.discount || 0)}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{carrier.delivery_days} days</p>
                      <p className="text-xs text-gray-500">
                        {carrier.expected_delivery_date &&
                          new Date(carrier.expected_delivery_date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCarrierSelect(carrier)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCarrier?.carrier_id === carrier.carrier_id &&
                        selectedCarrier?.service_code === carrier.service_code
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {selectedCarrier?.carrier_id === carrier.carrier_id &&
                      selectedCarrier?.service_code === carrier.service_code ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        "Select"
                      )}
                    </button>
                  </div>
                </div>

                {/* Features */}
                {carrier.features && carrier.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                    {carrier.features.slice(0, 4).map((feature: string) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize"
                      >
                        {feature.replace("_", " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Create Shipment Button */}
          {selectedCarrier && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">{selectedCarrier.carrier_name}</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedCarrier.total_charge)}</p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleCreateShipment}
                  disabled={createShipmentMutation.isPending || !selectedWarehouse}
                  loading={createShipmentMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
              {carrierWarehouses.length > 0 && (
                <select
                  value={selectedWarehouse || ""}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="">Select warehouse</option>
                  {carrierWarehouses.map((wh: any) => (
                    <option key={wh.id || wh.name} value={wh.id || wh.name}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default CreateShipment;
