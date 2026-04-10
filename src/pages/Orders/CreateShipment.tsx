import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Modal,
} from "../../components";

interface WarehouseOption {
  id?: number | string;
  name: string;
  address?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  is_registered?: boolean;
  is_default?: boolean;
}

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
  const queryClient = useQueryClient();
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [selectedCarrier, setSelectedCarrier] = useState<CarrierRate | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "time" | "rating" | "recommended">("recommended");
  const [filterPreset, setFilterPreset] = useState<"all" | "budget" | "fast" | "premium">("all");

  // Override package details
  const [showOverridePackage, setShowOverridePackage] = useState(false);
  const [overrideWeight, setOverrideWeight] = useState('');
  const [overrideLength, setOverrideLength] = useState('');
  const [overrideWidth, setOverrideWidth] = useState('');
  const [overrideHeight, setOverrideHeight] = useState('');

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
      const deliveryPincode = order.shipping_address?.pincode || order.shipping_address?.postal_code || order.delivery_pincode;
      const orderValue = order.total_amount;

      if (!deliveryPincode || !orderValue) {
        throw new Error("Missing required shipping information");
      }

      const isCOD = order.is_cod || order.payment_method === "cod";
      const isCODAdvance = order.is_cod_advance;
      const codAmount = isCOD && isCODAdvance && order.balance_amount
        ? order.balance_amount
        : (isCOD ? parseFloat(orderValue) : 0);

      const response = await api.post("/shipping/multi-carrier/rates/compare", {
        order_id: orderId,
        pickup_pincode: pickupLocation?.pincode || "110001",
        delivery_pincode: deliveryPincode,
        weight: calculateOrderWeight() || 1,
        order_value: parseFloat(orderValue),
        payment_mode: isCOD ? "cod" : "prepaid",
        cod_amount: codAmount,
        items: order.order_items?.map((item: any) => ({
          product_id: item.product_id,
          name: item.product_name,
          weight: parseFloat(item.product?.weight || "0.2"),
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
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("Shipment created successfully!");
      navigate(`/orders/${orderId}`);
    },
    onError: (error: any) => {
      // Read 'error' field first (contains actual API error), fallback to 'message' (generic)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to create shipment";
      toast.error(errorMessage);
    },
  });

  const calculateOrderWeight = () => {
    if (!order?.order_items) return 1;
    const result = order.order_items.reduce((total: number, item: any) => {
      const weight = parseFloat(item.product?.weight || "0.2");
      return total + weight * item.quantity;
    }, 0);
    return Math.max(result, 0.5); // Carrier minimum chargeable weight
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
    setSelectedCarrier(carrier);
    setShowShipmentModal(true);
  };

  const handleCreateShipment = () => {
    if (!selectedCarrier) {
      toast.error("Please select a carrier");
      return;
    }
    const requiresWarehouse = carrierWarehouses.length > 0;
    if (requiresWarehouse && !selectedWarehouse) {
      toast.error("Please select a pickup warehouse");
      return;
    }

    const currentWeight = overrideWeight ? parseFloat(overrideWeight) : (ratesData?.shipment_details?.billable_weight || calculateOrderWeight());
    const currentLength = overrideLength ? parseFloat(overrideLength) : 30;
    const currentWidth = overrideWidth ? parseFloat(overrideWidth) : 20;
    const currentHeight = overrideHeight ? parseFloat(overrideHeight) : 10;

    const payload = {
      order_id: orderId,
      carrier_id: selectedCarrier.carrier_id,
      service_code: selectedCarrier.service_code,
      warehouse_id: selectedWarehouse,
      shipping_cost: selectedCarrier.total_charge,
      ...(showOverridePackage && { weight: currentWeight, length: currentLength, width: currentWidth, height: currentHeight }),
    };
    console.log('Shipment payload:', JSON.stringify(payload, null, 2));
    createShipmentMutation.mutate(payload);
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
                  <p className="text-sm font-medium">Order #{order.order_number}</p>
                  <p className="text-xs text-gray-500">
                    {order.order_items?.length || 0} items • {formatCurrency(order.total_amount)}
                  </p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-3 border-t space-y-3 text-sm">
              {/* Route Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="w-0.5 h-6 bg-gray-300" />
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">Pickup From</p>
                      <p className="text-xs font-medium">{pickupLocation?.name || "Warehouse"}</p>
                      {pickupLocation?.city && <p className="text-[10px] text-gray-500">{pickupLocation.city}, {pickupLocation.state}</p>}
                      <p className="text-[10px] text-gray-500">{pickupLocation?.pincode || "110001"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-medium">Deliver To</p>
                      <p className="text-xs font-medium">
                        {order.shipping_address?.first_name && order.shipping_address?.last_name
                          ? `${order.shipping_address.first_name} ${order.shipping_address.last_name}`
                          : order.shipping_address?.name || order.user?.name || "Customer"}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {order.shipping_address?.address_line_1 || order.shipping_address?.address_1 || ""}
                      </p>
                      <p className="text-[10px] text-gray-500">{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code || order.shipping_address?.pincode}</p>
                      <p className="text-[10px] text-gray-500">Phone: {order.shipping_address?.phone_country_code || ''}{order.shipping_address?.phone || order.user?.phone || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Items */}
              {order.order_items && order.order_items.length > 0 && (
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Items</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs bg-gray-50 rounded px-2 py-1">
                        <span className="truncate flex-1 mr-2">{item.product_name} ×{item.quantity}</span>
                        <span className="font-medium">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Payment */}
              <div className={`rounded-lg p-2.5 space-y-1.5 ${order.is_cod || order.payment_method === "cod" ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Payment</p>
                  <Badge variant={order.is_cod || order.payment_method === "cod" ? "warning" : "success"} className="text-xs">
                    {order.is_cod || order.payment_method === "cod" ? "COD" : "PREPAID"}
                  </Badge>
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span><span>{formatCurrency(order.subtotal || 0)}</span>
                  </div>
                  {order.shipping_amount > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping</span><span>{formatCurrency(order.shipping_amount)}</span>
                    </div>
                  )}
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>Tax</span><span>{formatCurrency(order.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-0.5 border-t border-current border-opacity-20">
                    <span>Total</span><span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
                {order.is_cod_advance && order.advance_amount > 0 && (
                  <div className="pt-1 border-t border-orange-200 text-xs">
                    <div className="flex justify-between text-green-700">
                      <span>Advance paid</span><span className="font-bold">-{formatCurrency(order.advance_amount)}</span>
                    </div>
                    <div className="flex justify-between text-orange-700 font-semibold">
                      <span>Collect on delivery</span><span>{formatCurrency(order.balance_amount || order.total_amount)}</span>
                    </div>
                  </div>
                )}
                {order.payment_status === "paid" && !order.is_cod && (
                  <p className="text-[10px] text-green-700 font-semibold text-center pt-0.5 border-t border-green-200">Fully paid online</p>
                )}
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
              {/* Order Number, Date & Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-600">#{order.order_number}</span>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="text-xs text-gray-400">
                  Placed {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Route Visualization */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100" />
                    <div className="w-0.5 h-8 bg-gradient-to-b from-blue-300 to-green-300 my-1" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-green-100" />
                  </div>
                  <div className="flex-1 space-y-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pickup From</p>
                      <p className="font-medium text-gray-900">{pickupLocation?.name || "BookBharat Warehouse"}</p>
                      {pickupLocation?.address && <p className="text-xs text-gray-500">{pickupLocation.address}</p>}
                      <p className="text-xs text-gray-500">{pickupLocation?.city && pickupLocation?.state ? `${pickupLocation.city}, ${pickupLocation.state}` : ''} {pickupLocation?.pincode || "110001"}</p>
                      {pickupLocation?.phone && <p className="text-xs text-gray-500 mt-0.5">Phone: {pickupLocation.phone}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Deliver To</p>
                      <p className="font-medium text-gray-900">
                        {order.shipping_address?.first_name && order.shipping_address?.last_name
                          ? `${order.shipping_address.first_name} ${order.shipping_address.last_name}`
                          : order.shipping_address?.name || order.user?.name || "Customer"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.shipping_address?.address_line_1 || order.shipping_address?.address_1 || order.shipping_address?.house_number || ""}
                        {order.shipping_address?.address_line_2 ? ", " + order.shipping_address.address_line_2 : ""}
                      </p>
                      {order.shipping_address?.village_city_area && order.shipping_address?.village_city_area !== (order.shipping_address?.city) && (
                        <p className="text-xs text-gray-500">{order.shipping_address.village_city_area}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code || order.shipping_address?.pincode}
                      </p>
                      {order.shipping_address?.landmark && <p className="text-xs text-gray-500">Landmark: {order.shipping_address.landmark}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Phone:</span> {order.shipping_address?.phone_country_code || ''}{order.shipping_address?.phone || order.user?.phone || "N/A"}
                      </p>
                      {order.shipping_address?.whatsapp_number && order.shipping_address?.whatsapp_number !== order.shipping_address?.phone && (
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">WhatsApp:</span> {order.shipping_address?.whatsapp_country_code || ''}{order.shipping_address.whatsapp_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {order.order_items && order.order_items.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1.5">Items</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-md px-2.5 py-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                          <p className="text-gray-400">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                        </div>
                        <span className="font-medium text-gray-700 ml-2">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Package Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-400">Weight</p>
                  <p className="text-lg font-bold text-gray-900">{ratesData?.shipment_details?.billable_weight || calculateOrderWeight().toFixed(2)} <span className="text-xs font-normal text-gray-500">kg</span></p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                  <p className="text-xs text-gray-400">Shipping</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(order.shipping_amount || 0)}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className={`rounded-lg p-3 space-y-2 ${order.is_cod || order.payment_method === "cod" ? "bg-orange-50 border border-orange-200" : "bg-green-50 border border-green-200"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Payment</p>
                  <Badge variant={order.is_cod || order.payment_method === "cod" ? "warning" : "success"}>
                    {order.is_cod || order.payment_method === "cod" ? "COD" : "PREPAID"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(order.subtotal || 0)}</span>
                  </div>
                  {order.shipping_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span>{formatCurrency(order.shipping_amount)}</span>
                    </div>
                  )}
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax</span>
                      <span>{formatCurrency(order.tax_amount)}</span>
                    </div>
                  )}
                  {order.cod_charge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">COD charge</span>
                      <span>{formatCurrency(order.cod_charge)}</span>
                    </div>
                  )}
                  {order.packaging_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Packaging</span>
                      <span>{formatCurrency(order.packaging_amount)}</span>
                    </div>
                  )}
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-1 border-t border-current border-opacity-20">
                    <span>Total</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
                {order.is_cod_advance && order.advance_amount > 0 && (
                  <div className="mt-2 pt-2 border-t border-orange-200 space-y-1 text-xs">
                    <div className="flex justify-between text-green-700">
                      <span>Advance paid</span>
                      <span className="font-bold">-{formatCurrency(order.advance_amount)}</span>
                    </div>
                    <div className="flex justify-between text-orange-700 font-semibold">
                      <span>Collect on delivery</span>
                      <span>{formatCurrency(order.balance_amount || order.total_amount)}</span>
                    </div>
                  </div>
                )}
                {order.payment_status === "paid" && !order.is_cod && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs text-green-700 font-semibold text-center">Fully paid online</p>
                  </div>
                )}
              </div>
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
                    Create Shipment
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
                className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 p-4 transition-all"
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
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                  >
                    Create Shipment
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
        </div>
      </div>

      {/* Shipment Confirmation Modal */}
      <Modal
        open={showShipmentModal}
        onClose={() => {}}
        closeOnOverlayClick={false}
        title="Confirm Shipment"
        size="lg"
      >
        <div className="space-y-4">
          {/* Carrier Summary */}
          {selectedCarrier && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase">Carrier</p>
                  <p className="font-semibold text-lg">{selectedCarrier.carrier_name}</p>
                  <p className="text-sm text-gray-600">{selectedCarrier.service_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedCarrier.total_charge)}</p>
                  <p className="text-xs text-gray-500">{selectedCarrier.delivery_days} days</p>
                </div>
              </div>
            </div>
          )}

          {/* Warehouse Selection */}
          {carrierWarehouses.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Pickup Warehouse <span className="text-red-500">*</span></label>
              {warehousesLoading ? (
                <div className="text-sm text-gray-500 flex items-center gap-2 py-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  Loading warehouses...
                </div>
              ) : carrierWarehouses.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(carrierWarehouses as WarehouseOption[]).map((wh) => (
                    <button
                      key={wh.id || wh.name}
                      onClick={() => setSelectedWarehouse(String(wh.id || wh.name))}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedWarehouse === String(wh.id || wh.name)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{wh.name}</p>
                            {wh.is_registered && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Registered</span>
                            )}
                            {wh.is_default && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          {wh.address && <p className="text-xs text-gray-500 mt-1">{wh.address}</p>}
                          {wh.city && wh.pincode && <p className="text-xs text-gray-500">{wh.city} - {wh.pincode}</p>}
                        </div>
                        {selectedWarehouse === String(wh.id || wh.name) && (
                          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded">{warehouseMetadata.note || "No warehouses available"}</p>
              )}
            </div>
          )}

          {/* Override Package Details */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Override Package Weight & Dimensions</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOverridePackage(!showOverridePackage)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showOverridePackage ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showOverridePackage ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className={`grid grid-cols-2 gap-3 transition-opacity ${showOverridePackage ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  value={overrideWeight || (ratesData?.shipment_details?.billable_weight || calculateOrderWeight()).toFixed(2)}
                  onChange={(e) => setOverrideWeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  disabled={!showOverridePackage}
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Length (cm)</label>
                <input
                  type="number"
                  value={overrideLength || 30}
                  onChange={(e) => setOverrideLength(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  disabled={!showOverridePackage}
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Width (cm)</label>
                <input
                  type="number"
                  value={overrideWidth || 20}
                  onChange={(e) => setOverrideWidth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  disabled={!showOverridePackage}
                  min="1"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={overrideHeight || 10}
                  onChange={(e) => setOverrideHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  disabled={!showOverridePackage}
                  min="1"
                  step="1"
                />
              </div>
            </div>
          </div>

          {/* Shipment Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Shipment Details</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Order</span>
              <span className="font-medium">#{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Items</span>
              <span className="font-medium">{order.order_items?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Weight</span>
              <span className="font-medium">{ratesData?.shipment_details?.billable_weight || calculateOrderWeight().toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment</span>
              <Badge variant={order.is_cod || order.payment_method === "cod" ? "warning" : "success"}>
                {order.is_cod || order.payment_method === "cod" ? "COD" : "Prepaid"}
              </Badge>
            </div>
            {order.is_cod_advance && order.advance_amount > 0 && (
              <div className="flex justify-between text-orange-700">
                <span>Collect on delivery</span>
                <span className="font-bold">{formatCurrency(order.balance_amount || order.total_amount)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowShipmentModal(false);
                setShowOverridePackage(false);
                setOverrideWeight('');
                setOverrideLength('');
                setOverrideWidth('');
                setOverrideHeight('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                handleCreateShipment();
              }}
              disabled={createShipmentMutation.isPending || (carrierWarehouses.length > 0 && !selectedWarehouse)}
              loading={createShipmentMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Confirm & Create
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
};

export default CreateShipment;
