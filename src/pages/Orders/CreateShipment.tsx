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
  X,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  StatusBadge,
  Modal,
  Skeleton,
  SkeletonCard,
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

  const [selectedCarrier, setSelectedCarrier] = useState<CarrierRate | null>(
    null,
  );
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrice: null as number | null,
    minPrice: null as number | null,
    maxDays: null as number | null,
    minDays: null as number | null,
    minRating: null as number | null,
    minSuccessRate: null as number | null,
    features: [] as string[],
    carrierTypes: [] as string[],
    deliverySpeed: "" as "" | "express" | "standard" | "economy",
    showCheapestOnly: false,
    showFastestOnly: false,
    excludeSlowCarriers: false,
    excludeExpensiveCarriers: false,
  });
  const [sortBy, setSortBy] = useState<
    "price" | "time" | "rating" | "recommended"
  >("recommended");
  const [filterPreset, setFilterPreset] = useState<
    "all" | "budget" | "fast" | "premium" | "balanced"
  >("all");
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonCarriers, setComparisonCarriers] = useState<CarrierRate[]>(
    [],
  );

  // Fetch order details
  const { data: orderResponse, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    },
  });

  const order = orderResponse?.order;

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const response = await api.get("/warehouses");
      return response.data?.data || response.data || [];
    },
  });

  const warehouses = warehousesData || [];

  // Fetch carrier-specific warehouse mappings when carrier is selected
  const { data: carrierWarehousesResponse, isLoading: warehousesLoading } =
    useQuery({
      queryKey: ["carrier-warehouses", selectedCarrier?.carrier_id],
      queryFn: async () => {
        if (!selectedCarrier?.carrier_id) return null;
        const response = await api.get(
          `/shipping/multi-carrier/carriers/${selectedCarrier.carrier_id}/warehouses`,
        );
        console.log("Warehouse API Response:", response.data);
        return response.data || null;
      },
      enabled: !!selectedCarrier,
    });

  const carrierWarehouses = carrierWarehousesResponse?.data || [];
  const warehouseMetadata = {
    requirementType: carrierWarehousesResponse?.requirement_type,
    source: carrierWarehousesResponse?.source,
    note: carrierWarehousesResponse?.note,
    carrierCode: carrierWarehousesResponse?.carrier_code,
  };

  // Log for debugging
  React.useEffect(() => {
    if (selectedCarrier) {
      console.log("Carrier selected:", selectedCarrier.carrier_name);
      console.log("Warehouses loaded:", carrierWarehouses.length);
      console.log("Warehouse data:", carrierWarehouses);
      console.log("Metadata:", warehouseMetadata);
    }
  }, [selectedCarrier, carrierWarehouses]);

  // Auto-select warehouse when carrier is selected
  React.useEffect(() => {
    if (selectedCarrier && !selectedWarehouse && carrierWarehouses.length > 0) {
      // First priority: registered warehouses (carrier-approved pickup locations)
      const registeredWarehouses = carrierWarehouses.filter(
        (w: any) => w.is_registered,
      );
      if (registeredWarehouses.length > 0) {
        // Auto-select the first registered warehouse (typically the only one)
        setSelectedWarehouse(
          registeredWarehouses[0].id || registeredWarehouses[0].name,
        );
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
        setSelectedWarehouse(
          carrierWarehouses[0].id || carrierWarehouses[0].name,
        );
      }
    }
  }, [selectedCarrier, carrierWarehouses, selectedWarehouse]);

  // Fetch pickup location configuration (fallback)
  const { data: pickupLocation } = useQuery({
    queryKey: ["pickup-location"],
    queryFn: async () => {
      const response = await api.get("/shipping/multi-carrier/pickup-location");
      return response.data.data;
    },
  });

  // Fetch shipping rates
  const {
    data: ratesData,
    isLoading: ratesLoading,
    refetch: refetchRates,
  } = useQuery({
    queryKey: ["shipping-rates", orderId],
    queryFn: async () => {
      if (!order) return null;

      // Ensure required fields are present
      const deliveryPincode =
        order.shipping_address?.pincode || order.delivery_pincode;
      const orderValue = order.total_amount;

      if (!deliveryPincode || !orderValue) {
        console.error("Missing required fields:", {
          deliveryPincode,
          orderValue,
          order,
        });
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
      // Backend returns { success, message, data }
      // We need to return data.data to get the actual rates
      return response.data?.data || response.data;
    },
    enabled: !!order && !!pickupLocation,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Calculate total order weight
  const calculateOrderWeight = () => {
    if (!order?.order_items) return 1;
    return order.order_items.reduce((total: number, item: any) => {
      const weight = parseFloat(item.product?.weight || "0.5");
      return total + weight * item.quantity;
    }, 0);
  };

  // Apply filter presets
  const applyFilterPreset = (preset: typeof filterPreset) => {
    setFilterPreset(preset);

    switch (preset) {
      case "budget":
        setFilters({
          ...filters,
          maxPrice: 100,
          minPrice: null,
          maxDays: null,
          minDays: null,
          minRating: null,
          minSuccessRate: null,
          deliverySpeed: "",
          showCheapestOnly: true,
          showFastestOnly: false,
          excludeSlowCarriers: false,
          excludeExpensiveCarriers: true,
        });
        setSortBy("price");
        break;

      case "fast":
        setFilters({
          ...filters,
          maxPrice: null,
          minPrice: null,
          maxDays: 3,
          minDays: null,
          minRating: null,
          minSuccessRate: null,
          deliverySpeed: "express",
          showCheapestOnly: false,
          showFastestOnly: true,
          excludeSlowCarriers: true,
          excludeExpensiveCarriers: false,
        });
        setSortBy("time");
        break;

      case "premium":
        setFilters({
          ...filters,
          maxPrice: null,
          minPrice: null,
          maxDays: null,
          minDays: null,
          minRating: 4.0,
          minSuccessRate: 95,
          deliverySpeed: "",
          showCheapestOnly: false,
          showFastestOnly: false,
          excludeSlowCarriers: false,
          excludeExpensiveCarriers: false,
        });
        setSortBy("rating");
        break;

      case "balanced":
        setFilters({
          ...filters,
          maxPrice: 150,
          minPrice: null,
          maxDays: 5,
          minDays: null,
          minRating: 3.5,
          minSuccessRate: 90,
          deliverySpeed: "",
          showCheapestOnly: false,
          showFastestOnly: false,
          excludeSlowCarriers: false,
          excludeExpensiveCarriers: false,
        });
        setSortBy("recommended");
        break;

      case "all":
      default:
        setFilters({
          maxPrice: null,
          minPrice: null,
          maxDays: null,
          minDays: null,
          minRating: null,
          minSuccessRate: null,
          features: [],
          carrierTypes: [],
          deliverySpeed: "",
          showCheapestOnly: false,
          showFastestOnly: false,
          excludeSlowCarriers: false,
          excludeExpensiveCarriers: false,
        });
        setSortBy("recommended");
        break;
    }
  };

  // Filter and sort carriers
  const getFilteredAndSortedCarriers = () => {
    if (!ratesData?.rates) return [];

    let filtered = [...ratesData.rates];

    // Apply price filters
    if (filters.maxPrice !== null) {
      filtered = filtered.filter((c) => c.total_charge <= filters.maxPrice!);
    }
    if (filters.minPrice !== null) {
      filtered = filtered.filter((c) => c.total_charge >= filters.minPrice!);
    }

    // Apply delivery time filters
    if (filters.maxDays !== null) {
      filtered = filtered.filter((c) => c.delivery_days <= filters.maxDays!);
    }
    if (filters.minDays !== null) {
      filtered = filtered.filter((c) => c.delivery_days >= filters.minDays!);
    }

    // Apply rating filters
    if (filters.minRating !== null) {
      filtered = filtered.filter((c) => c.rating >= filters.minRating!);
    }
    if (filters.minSuccessRate !== null) {
      filtered = filtered.filter(
        (c) => c.success_rate >= filters.minSuccessRate!,
      );
    }

    // Apply feature filters
    if (filters.features.length > 0) {
      filtered = filtered.filter((c) =>
        filters.features.every((f) => c.features.includes(f)),
      );
    }

    // Apply carrier type filters
    if (filters.carrierTypes.length > 0) {
      filtered = filtered.filter((c) =>
        filters.carrierTypes.includes(c.carrier_code),
      );
    }

    // Apply delivery speed filter
    if (filters.deliverySpeed === "express") {
      filtered = filtered.filter((c) => c.delivery_days <= 2);
    } else if (filters.deliverySpeed === "standard") {
      filtered = filtered.filter(
        (c) => c.delivery_days > 2 && c.delivery_days <= 5,
      );
    } else if (filters.deliverySpeed === "economy") {
      filtered = filtered.filter((c) => c.delivery_days > 5);
    }

    // Apply boolean filters
    if (filters.showCheapestOnly) {
      const cheapest = Math.min(...filtered.map((c) => c.total_charge));
      filtered = filtered.filter((c) => c.total_charge === cheapest);
    }
    if (filters.showFastestOnly) {
      const fastest = Math.min(...filtered.map((c) => c.delivery_days));
      filtered = filtered.filter((c) => c.delivery_days === fastest);
    }
    if (filters.excludeSlowCarriers) {
      const avgDays =
        filtered.reduce((sum, c) => sum + c.delivery_days, 0) / filtered.length;
      filtered = filtered.filter((c) => c.delivery_days <= avgDays);
    }
    if (filters.excludeExpensiveCarriers) {
      const avgPrice =
        filtered.reduce((sum, c) => sum + c.total_charge, 0) / filtered.length;
      filtered = filtered.filter((c) => c.total_charge <= avgPrice);
    }

    // Sort
    switch (sortBy) {
      case "price":
        return filtered.sort((a, b) => a.total_charge - b.total_charge);
      case "time":
        return filtered.sort((a, b) => a.delivery_days - b.delivery_days);
      case "rating":
        return filtered.sort((a, b) => b.rating - a.rating);
      case "recommended":
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
      toast.error("You can compare up to 3 carriers at a time");
      return;
    }
    if (
      comparisonCarriers.find(
        (c) =>
          c.carrier_id === carrier.carrier_id &&
          c.service_code === carrier.service_code,
      )
    ) {
      toast.error("This carrier service is already in comparison");
      return;
    }
    setComparisonCarriers([...comparisonCarriers, carrier]);
    setShowComparison(true);
  };

  // Remove from comparison
  const handleRemoveFromComparison = (carrier: CarrierRate) => {
    setComparisonCarriers(
      comparisonCarriers.filter(
        (c) =>
          !(
            c.carrier_id === carrier.carrier_id &&
            c.service_code === carrier.service_code
          ),
      ),
    );
  };

  // Create shipment
  const handleCreateShipment = () => {
    if (!selectedCarrier) {
      toast.error("Please select a carrier");
      return;
    }

    if (!selectedWarehouse) {
      toast.error("Please select a pickup warehouse");
      return;
    }

    const shipmentData = {
      order_id: orderId,
      carrier_id: selectedCarrier.carrier_id,
      service_code: String(selectedCarrier.service_code), // Ensure string
      shipping_cost: selectedCarrier.total_charge,
      expected_delivery_date: selectedCarrier.expected_delivery_date,
      warehouse_id: String(selectedWarehouse), // Ensure string
      schedule_pickup: true,
    };

    createShipmentMutation.mutate(shipmentData);
  };

  const carriers = getFilteredAndSortedCarriers();
  const recommended = ratesData?.recommended;

  if (orderLoading) {
    return <PageSkeleton type="detail" />;
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/orders/${orderId}`)}
            className="hidden sm:flex"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Shipment</h1>
            <p className="text-sm text-gray-500 mt-1">Order #{order?.order_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/orders/${orderId}`)}
            className="sm:hidden"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-sm font-normal text-gray-500">#{order?.order_number}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>

            {/* Addresses */}
            <div className="relative pl-4 space-y-8 mb-8 border-l-2 border-dashed border-gray-200 ml-2">
              <div className="relative">
                <span className="absolute -left-[23px] top-0 h-6 w-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
                   <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </span>
                <div className="mb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pickup From</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{pickupLocation?.name || 'BookBharat Warehouse'}</p>
                 <p className="text-sm text-gray-500 leading-relaxed">
                  {pickupLocation?.city && <>{pickupLocation.city}, {pickupLocation.state}<br /></>}
                  <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">{pickupLocation?.pincode || '110001'}</span>
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-[23px] top-0 h-6 w-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                   <MapPin className="h-3 w-3 text-green-600" />
                </span>
                <div className="mb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deliver To</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {order?.shipping_address?.name || order?.customer_name || 'Customer'}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {order?.shipping_address?.address_line_1 || order?.shipping_address?.address}<br />
                  {order?.shipping_address?.city}, {order?.shipping_address?.state}<br />
                  <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">{order?.shipping_address?.pincode}</span>
                </p>
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <Package className="h-4 w-4 mr-2 text-gray-400" />
                Package info
              </h3>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Items Count</span>
                <span className="font-medium text-gray-900">{order?.order_items?.length || 0} items</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Weight</span>
                <span className="font-medium text-gray-900">{ratesData?.shipment_details?.billable_weight || 0} kg</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Order Value</span>
                <span className="font-medium text-gray-900">₹{order?.total_amount}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Payment Mode</span>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  order?.payment_method === 'cod' 
                    ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {order?.payment_method === 'cod' ? 'COD' : 'PREPAID'}
                </span>
              </div>
              
              {order?.payment_method === 'cod' && (
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-orange-700 font-medium">To Collect</span>
                  <span className="font-bold text-orange-700">₹{Number(order?.total_amount || 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Selected Carrier */}
            {selectedCarrier && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-4">
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">
                    Selected Carrier
                  </h3>
                  <div className="text-sm">
                    <p className="font-medium">
                      {selectedCarrier.carrier_name}
                    </p>
                    <p className="text-gray-600">
                      {selectedCarrier.service_name}
                    </p>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      ₹{Number(selectedCarrier.total_charge).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Warehouse Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Pickup Warehouse
                  </label>

                  {/* Warehouse Type Indicator */}
                  {warehouseMetadata.note && (
                    <div
                      className={`mb-2 p-2 rounded-md border text-xs flex items-start gap-2 ${
                        warehouseMetadata.source === "carrier_api"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <Info
                        className={`h-3 w-3 mt-0.5 flex-shrink-0 ${
                          warehouseMetadata.source === "carrier_api"
                            ? "text-blue-600"
                            : "text-green-600"
                        }`}
                      />
                      <span
                        className={
                          warehouseMetadata.source === "carrier_api"
                            ? "text-blue-800"
                            : "text-green-800"
                        }
                      >
                        {warehouseMetadata.note}
                      </span>
                    </div>
                  )}

                  {warehousesLoading ? (
                    <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-2 border border-gray-200 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading warehouses...
                    </div>
                  ) : carrierWarehouses.length > 0 ? (
                    <select
                      value={selectedWarehouse || ""}
                      onChange={(e) => setSelectedWarehouse(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="">Select warehouse...</option>
                      {carrierWarehouses.map((wh: any) => (
                        <option key={wh.id || wh.name} value={wh.id || wh.name}>
                          {wh.name}
                          {wh.id && wh.id !== wh.name && ` [ID: ${wh.id}]`}
                          {wh.pincode && ` - ${wh.pincode}`}
                          {wh.carrier_warehouse_name &&
                            wh.carrier_warehouse_name !== wh.name &&
                            ` → ${wh.carrier_warehouse_name}`}
                          {wh.is_registered && " ✓"}
                        </option>
                      ))}
                    </select>
                  ) : selectedCarrier ? (
                    <div className="text-sm text-gray-500 bg-yellow-50 rounded-md p-2 border border-yellow-200">
                      <Info className="h-4 w-4 inline mr-1" />
                      No warehouses available for {selectedCarrier.carrier_name}
                      . Please check carrier configuration.
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-50 rounded-md p-2 border border-gray-200">
                      <Info className="h-4 w-4 inline mr-1" />
                      Select a carrier first
                    </div>
                  )}
                  {selectedWarehouse && carrierWarehouses.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      {(() => {
                        const wh = carrierWarehouses.find(
                          (w: any) => (w.id || w.name) === selectedWarehouse,
                        );
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
                            {wh.carrier_warehouse_name &&
                              wh.carrier_warehouse_name !== wh.name && (
                                <p className="text-blue-600 text-sm">
                                  Carrier Alias: {wh.carrier_warehouse_name}
                                </p>
                              )}
                            {(wh.address || wh.city) && (
                              <p className="text-sm text-gray-600">
                                {wh.address && `${wh.address}, `}
                                {wh.city && `${wh.city}`}
                                {wh.pincode && ` - ${wh.pincode}`}
                              </p>
                            )}
                            {wh.phone && (
                              <p className="text-sm text-gray-600">
                                Phone: {wh.phone}
                              </p>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleCreateShipment}
                  disabled={createShipmentMutation.isPending || !selectedWarehouse}
                  loading={createShipmentMutation.isPending}
                >
                  {createShipmentMutation.isPending ? (
                    "Creating..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create Shipment
                    </>
                  )}
                </Button>
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        {/* Carrier Options */}
        <div className="lg:col-span-2">
          {/* Filters and Sorting */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            {/* Filter Presets */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 mr-2">Quick Filters:</span>
              {[
                { value: "all", label: "All Options", icon: Filter },
                { value: "budget", label: "Budget", icon: DollarSign },
                { value: "fast", label: "Fast Delivery", icon: Zap },
                { value: "premium", label: "Premium", icon: Award },
                { value: "balanced", label: "Balanced", icon: TrendingUp },
              ].map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.value}
                    onClick={() => applyFilterPreset(preset.value as any)}
                    className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filterPreset === preset.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="h-3 w-3 mr-1.5" />
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                  {showFilters ? (
                    <ChevronUp className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                >
                  <option value="recommended">Sort: Recommended</option>
                  <option value="price">Sort: Price (Low to High)</option>
                  <option value="time">Sort: Delivery Time</option>
                  <option value="rating">Sort: Rating</option>
                </select>

                {carriers.length > 0 && (
                  <span className="text-sm text-gray-600">
                    Showing {carriers.length} of {ratesData?.rates?.length || 0}{" "}
                    options
                  </span>
                )}
              </div>

              <button
                onClick={() => refetchRates()}
                className="flex items-center px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-md"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>

            {/* Advanced Filter Options */}
            {showFilters && (
              <div className="border-t pt-4 space-y-4">
                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Price Range (₹)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        value={filters.minPrice || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minPrice: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                        placeholder="Min price"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={filters.maxPrice || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxPrice: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                        placeholder="Max price"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Time Range */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Delivery Time (days)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        value={filters.minDays || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minDays: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                        placeholder="Min days"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={filters.maxDays || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            maxDays: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                        placeholder="Max days"
                      />
                    </div>
                  </div>
                </div>

                {/* Quality Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Min Rating
                    </label>
                    <select
                      value={filters.minRating || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          minRating: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="">Any Rating</option>
                      <option value="3.0">3.0+ ⭐⭐⭐</option>
                      <option value="3.5">3.5+ ⭐⭐⭐+</option>
                      <option value="4.0">4.0+ ⭐⭐⭐⭐</option>
                      <option value="4.5">4.5+ ⭐⭐⭐⭐+</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Min Success Rate
                    </label>
                    <select
                      value={filters.minSuccessRate || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          minSuccessRate: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="">Any Success Rate</option>
                      <option value="85">85%+</option>
                      <option value="90">90%+</option>
                      <option value="95">95%+</option>
                      <option value="98">98%+</option>
                    </select>
                  </div>
                </div>

                {/* Delivery Speed */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Delivery Speed
                  </label>
                  <select
                    value={filters.deliverySpeed}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        deliverySpeed: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="">All Speeds</option>
                    <option value="express">Express (≤2 days)</option>
                    <option value="standard">Standard (3-5 days)</option>
                    <option value="economy">Economy (&gt;5 days)</option>
                  </select>
                </div>

                {/* Quick Toggle Filters */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Quick Filters
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center text-sm p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showCheapestOnly}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            showCheapestOnly: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      Cheapest only
                    </label>
                    <label className="flex items-center text-sm p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.showFastestOnly}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            showFastestOnly: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      Fastest only
                    </label>
                    <label className="flex items-center text-sm p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.excludeSlowCarriers}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            excludeSlowCarriers: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      Exclude slow
                    </label>
                    <label className="flex items-center text-sm p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.excludeExpensiveCarriers}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            excludeExpensiveCarriers: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      Exclude expensive
                    </label>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Required Features
                  </label>
                  <div className="space-y-2">
                    {[
                      "tracking",
                      "insurance",
                      "cod",
                      "doorstep_delivery",
                      "priority_handling",
                    ].map((feature) => (
                      <label
                        key={feature}
                        className="flex items-center text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={filters.features.includes(feature)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({
                                ...filters,
                                features: [...filters.features, feature],
                              });
                            } else {
                              setFilters({
                                ...filters,
                                features: filters.features.filter(
                                  (f) => f !== feature,
                                ),
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="capitalize">
                          {feature.replace("_", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Carrier Selection */}
                {ratesData?.rates && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Specific Carriers
                    </label>
                    <div className="space-y-2">
                      {Array.from(
                        new Set<string>(
                          ratesData.rates.map(
                            (r: CarrierRate) => r.carrier_code,
                          ),
                        ),
                      ).map((code) => {
                        const carrier = ratesData.rates.find(
                          (r: CarrierRate) => r.carrier_code === code,
                        );
                        return (
                          <label
                            key={code}
                            className="flex items-center text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={filters.carrierTypes.includes(code)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters({
                                    ...filters,
                                    carrierTypes: [
                                      ...filters.carrierTypes,
                                      code,
                                    ],
                                  });
                                } else {
                                  setFilters({
                                    ...filters,
                                    carrierTypes: filters.carrierTypes.filter(
                                      (c) => c !== code,
                                    ),
                                  });
                                }
                              }}
                              className="mr-2"
                            />
                            {carrier?.carrier_name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Clear All Filters */}
                <div className="col-span-full flex justify-end pt-3 border-t">
                  <button
                    onClick={() => {
                      setFilters({
                        maxPrice: null,
                        minPrice: null,
                        maxDays: null,
                        minDays: null,
                        minRating: null,
                        minSuccessRate: null,
                        features: [],
                        carrierTypes: [],
                        deliverySpeed: "",
                        showCheapestOnly: false,
                        showFastestOnly: false,
                        excludeSlowCarriers: false,
                        excludeExpensiveCarriers: false,
                      });
                      setFilterPreset("all");
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Clear All Filters
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
                <p className="text-2xl font-bold">
                  {ratesData.summary.available_options}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Price Range</p>
                <p className="text-lg font-semibold">
                  ₹{Number(ratesData.summary.price_range.min).toFixed(2)} - ₹
                  {Number(ratesData.summary.price_range.max).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Delivery Range</p>
                <p className="text-lg font-semibold">
                  {ratesData.summary.delivery_range.min}-
                  {ratesData.summary.delivery_range.max} days
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600">Avg Price</p>
                <p className="text-2xl font-bold">
                  ₹{Number(ratesData.summary.average_price).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Recommended Option */}
          {recommended && (
            <div className="relative overflow-hidden bg-white rounded-xl shadow-lg border border-blue-200 mb-8 transition-transform hover:scale-[1.01] duration-300">
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 -mr-16 -mt-16 pointer-events-none"></div>

              <div className="relative p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
                <div className="bg-white p-5 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <Award className="h-5 w-5 text-blue-600" />
                       </span>
                       <div>
                         <h3 className="font-bold text-gray-900">Recommended for you</h3>
                         <p className="text-xs text-gray-500">{recommended.recommendation_reason || 'Best balance of speed and cost'}</p>
                       </div>
                    </div>
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-sm">
                      BEST CHOICE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Carrier Info */}
                    <div className="md:col-span-4 flex items-center">
                      <div className="h-14 w-14 flex-shrink-0 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center p-1 mr-4">
                        {recommended.carrier_logo ? (
                          <img
                            src={recommended.carrier_logo}
                            alt={recommended.carrier_name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Truck className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900 leading-tight">{recommended.carrier_name}</p>
                        <p className="text-sm text-gray-500">{recommended.service_name}</p>
                        <div className="flex items-center mt-1">
                           <div className="flex text-yellow-500">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`h-3 w-3 ${i < Math.floor(recommended.rating) ? 'fill-current' : 'text-gray-300'}`} />
                             ))}
                           </div>
                           <span className="text-xs text-gray-400 ml-2">({recommended.success_rate}% success)</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="md:col-span-5 flex items-center justify-around bg-gray-50 rounded-lg p-3 border border-gray-100">
                       <div className="text-center px-4 border-r border-gray-200 last:border-0 hover:bg-white transition-colors p-2 rounded">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Cost</p>
                          <p className="text-xl font-bold text-gray-900">₹{Number(recommended.total_charge).toFixed(0)}</p>
                          {recommended.has_discount && <span className="text-[10px] text-green-600 font-medium">Save ₹{Number(recommended.discount).toFixed(0)}</span>}
                       </div>
                       <div className="text-center px-4 hover:bg-white transition-colors p-2 rounded">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Delivery</p>
                          <p className="text-xl font-bold text-gray-900">{recommended.delivery_days}<span className="text-sm text-gray-500 font-normal ml-1">days</span></p>
                          <span className="text-[10px] text-blue-600 font-medium">{recommended.is_fastest ? 'Fastest' : 'Standard'}</span>
                       </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-3 flex flex-col gap-2">
                      <button
                        onClick={() => handleCarrierSelect(recommended)}
                        className="w-full py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center font-medium"
                      >
                        Select Carrier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Carrier List */}
          <div className="space-y-4 relative min-h-[200px]">
            {ratesLoading && (
              <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-10 backdrop-blur-sm rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                  <span className="text-sm text-blue-800 font-medium">Updating rates...</span>
                </div>
              </div>
            )}
            {carriers.map((carrier, index) => (
              <div
                key={`${carrier.carrier_id}-${carrier.service_code}-${index}`}
                className={`group relative bg-white rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                  selectedCarrier?.carrier_id === carrier.carrier_id &&
                  selectedCarrier?.service_code === carrier.service_code
                    ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50/10"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* 1. Carrier Info (Cols 1-4) */}
                  <div className="md:col-span-4 flex items-center">
                    <div className="h-12 w-12 flex-shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center p-1 mr-3 shadow-sm group-hover:scale-110 transition-transform">
                      {carrier.carrier_logo ? (
                        <img
                          src={carrier.carrier_logo}
                          alt={carrier.carrier_name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <Truck className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{carrier.carrier_name}</h4>
                      <p className="text-xs text-gray-500 mb-1">{carrier.service_name}</p>
                      
                      {/* Rating Pill */}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                         <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                         {carrier.rating} • {carrier.success_rate}%
                      </span>
                    </div>
                  </div>

                  {/* 2. Delivery Info (Cols 5-7) */}
                  <div className="md:col-span-3">
                     <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase font-medium tracking-wide">Delivery</span>
                        <div className="flex items-center font-medium text-gray-900">
                           <Clock className="h-3 w-3 mr-1 text-gray-400" />
                           {carrier.delivery_days} Days
                        </div>
                        {carrier.expected_delivery_date && (
                           <span className="text-xs text-green-600">
                             {new Date(carrier.expected_delivery_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                           </span>
                        )}
                     </div>
                  </div>

                  {/* 3. Price Info (Cols 8-9) */}
                  <div className="md:col-span-2 text-right md:text-left">
                     <span className="text-xs text-gray-500 uppercase font-medium tracking-wide">Cost</span>
                     <div className="flex flex-col">
                        <span className="text-lg font-bold text-gray-900">₹{Number(carrier.total_charge).toFixed(0)}</span>
                        {carrier.has_discount && (
                           <span className="text-xs text-green-600 font-medium">Save ₹{Number(carrier.discount).toFixed(0)}</span>
                        )}
                     </div>
                  </div>

                  {/* 4. Actions (Cols 10-12) */}
                  <div className="md:col-span-3 flex justify-end items-center gap-2">
                     <button
                       onClick={() => handleAddToComparison(carrier)}
                       className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                       title="Compare"
                     >
                       <TrendingUp className="h-5 w-5" />
                     </button>
                    
                     <button
                       onClick={() => handleCarrierSelect(carrier)}
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                         selectedCarrier?.carrier_id === carrier.carrier_id &&
                         selectedCarrier?.service_code === carrier.service_code
                           ? "bg-green-600 text-white hover:bg-green-700 ring-2 ring-offset-1 ring-green-600"
                           : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                       }`}
                     >
                       {selectedCarrier?.carrier_id === carrier.carrier_id &&
                       selectedCarrier?.service_code === carrier.service_code ? (
                         <>
                           <CheckCircle className="h-4 w-4 inline mr-1" />
                           Selected
                         </>
                       ) : (
                         "Select"
                       )}
                     </button>
                  </div>
                </div>

                {/* Features */}
                {carrier.features && carrier.features.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-4">
                    <span className="text-sm text-gray-600">Features:</span>
                    <div className="flex flex-wrap gap-2">
                      {carrier.features.map((feature: string, idx: number) => {
                        const featureConfig: Record<
                          string,
                          {
                            label: string;
                            color: string;
                            icon?: React.ReactNode;
                          }
                        > = {
                          tracking: {
                            label: "Live Tracking",
                            color: "bg-blue-50 text-blue-700 border-blue-200",
                          },
                          cod: {
                            label: "COD Available",
                            color:
                              "bg-green-50 text-green-700 border-green-200",
                          },
                          doorstep_delivery: {
                            label: "Doorstep Delivery",
                            color:
                              "bg-purple-50 text-purple-700 border-purple-200",
                          },
                          priority_handling: {
                            label: "Priority Handling",
                            color:
                              "bg-orange-50 text-orange-700 border-orange-200",
                          },
                          insurance_optional: {
                            label: "Insurance Available",
                            color:
                              "bg-yellow-50 text-yellow-700 border-yellow-200",
                          },
                          insurance: {
                            label: "Insured",
                            color:
                              "bg-yellow-50 text-yellow-700 border-yellow-200",
                          },
                          sms_updates: {
                            label: "SMS Updates",
                            color:
                              "bg-indigo-50 text-indigo-700 border-indigo-200",
                          },
                          express: {
                            label: "Express",
                            color: "bg-red-50 text-red-700 border-red-200",
                          },
                          signature_required: {
                            label: "Signature Required",
                            color: "bg-gray-50 text-gray-700 border-gray-200",
                          },
                        };
                        const config = featureConfig[feature] || {
                          label: feature
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase()),
                          color: "bg-gray-50 text-gray-700 border-gray-200",
                        };
                        return (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full border ${config.color}`}
                          >
                            {config.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!ratesLoading && carriers.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No carriers available for this route
              </p>
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
                            <p className="font-medium">
                              {carrier.carrier_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {carrier.service_name}
                            </p>
                            <button
                              onClick={() =>
                                handleRemoveFromComparison(carrier)
                              }
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
                          <p className="text-lg font-bold">
                            ₹{Number(carrier.total_charge).toFixed(2)}
                          </p>
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
