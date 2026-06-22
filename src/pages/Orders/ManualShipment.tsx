import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../api/axios";
import { toKg, toGrams } from "../../utils/weight";
import { toast } from '../../utils/toast';
import {
  Package,
  Truck,
  MapPin,
  DollarSign,
  Search,
  Send,
  ArrowLeft,
  X,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Building,
  User,
  Phone,
  Mail,
  MapPinned,
  Weight,
  Ruler,
  Box,
  CreditCard,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Textarea,
} from "../../components";

// Types
interface Carrier {
  id: number;
  code: string;
  name: string;
  logo?: string;
  is_active: boolean;
  supports_cod: boolean;
  supports_prepaid: boolean;
}

interface Warehouse {
  id: number;
  name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
  is_default: boolean;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email?: string;
  };
  total: number;
  payment_method: string;
  status: string;
  cod_breakdown?: {
    charge: number;
    is_advance: boolean;
    advance_amount?: number;
    balance_amount?: number;
  };
  items: Array<{
    id: number;
    product_name: string;
    sku: string;
    quantity: number;
    price: number;
    weight?: number;
  }>;
}

interface ShipmentFormData {
  // Order Selection
  order_id: string;
  order_number: string;
  
  // Carrier Selection
  carrier_id: string;
  carrier_code: string;
  service_code: string;
  warehouse_id: string;
  
  // Pickup Address (can be edited)
  pickup_name: string;
  pickup_phone: string;
  pickup_email: string;
  pickup_address_line_1: string;
  pickup_address_line_2: string;
  pickup_city: string;
  pickup_state: string;
  pickup_pincode: string;
  
  // Delivery Address (can be edited)
  delivery_name: string;
  delivery_phone: string;
  delivery_email: string;
  delivery_address_line_1: string;
  delivery_address_line_2: string;
  delivery_city: string;
  delivery_state: string;
  delivery_pincode: string;
  
  // Package Details
  package_weight: string;
  package_length: string;
  package_width: string;
  package_height: string;
  package_value: string;
  package_description: string;
  package_quantity: string;
  
  // Payment Details
  payment_mode: 'cod' | 'prepaid';
  cod_amount: string;
  invoice_number: string;
  
  // Additional Options
  is_fragile: boolean;
  is_insured: boolean;
  insurance_value: string;
  remarks: string;
}

const initialFormData: ShipmentFormData = {
  order_id: '',
  order_number: '',
  carrier_id: '',
  carrier_code: '',
  service_code: '',
  warehouse_id: '',
  pickup_name: '',
  pickup_phone: '',
  pickup_email: '',
  pickup_address_line_1: '',
  pickup_address_line_2: '',
  pickup_city: '',
  pickup_state: '',
  pickup_pincode: '',
  delivery_name: '',
  delivery_phone: '',
  delivery_email: '',
  delivery_address_line_1: '',
  delivery_address_line_2: '',
  delivery_city: '',
  delivery_state: '',
  delivery_pincode: '',
  package_weight: '300',
  package_length: '30',
  package_width: '20',
  package_height: '10',
  package_value: '',
  package_description: 'Books',
  package_quantity: '1',
  payment_mode: 'prepaid',
  cod_amount: '0',
  invoice_number: '',
  is_fragile: false,
  is_insured: false,
  insurance_value: '',
  remarks: '',
};

const ManualShipment: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ShipmentFormData>(initialFormData);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [showOrderSearch, setShowOrderSearch] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  // Fetch active carriers
  const { data: carriersResponse, isLoading: carriersLoading } = useQuery({
    queryKey: ['shipping-carriers'],
    queryFn: async () => {
      const response = await api.get('/shipping/carriers');
      return response.data;
    },
  });

  const carriers = Array.isArray(carriersResponse?.data) 
    ? carriersResponse.data 
    : Array.isArray(carriersResponse) 
      ? carriersResponse 
      : [];

  // Fetch warehouses
  const { data: warehousesResponse, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/shipping/warehouses');
      return response.data;
    },
  });

  // Handle multiple response formats - could be { data: [...] } or just [...]
  const warehouses = Array.isArray(warehousesResponse?.data) 
    ? warehousesResponse.data 
    : Array.isArray(warehousesResponse) 
      ? warehousesResponse 
      : [];

  // Fetch carrier warehouses when carrier is selected
  const { data: carrierWarehousesResponse, isLoading: carrierWarehousesLoading } = useQuery({
    queryKey: ['carrier-warehouses', formData.carrier_code],
    queryFn: async () => {
      if (!formData.carrier_code) return { data: [] };
      const response = await api.get(`/shipping/multi-carrier/carriers/${formData.carrier_code}/warehouses`);
      return response.data;
    },
    enabled: !!formData.carrier_code,
  });

  const carrierWarehouses = Array.isArray(carrierWarehousesResponse?.warehouses) 
    ? carrierWarehousesResponse.warehouses 
    : Array.isArray(carrierWarehousesResponse?.data) 
      ? carrierWarehousesResponse.data 
      : Array.isArray(carrierWarehousesResponse) 
        ? carrierWarehousesResponse 
        : [];

  // Search orders
  const { data: ordersSearchResponse, isLoading: ordersSearchLoading, refetch: searchOrders } = useQuery({
    queryKey: ['orders-search', orderSearchQuery],
    queryFn: async () => {
      if (!orderSearchQuery || orderSearchQuery.length < 2) return { data: [] };
      const response = await api.get(`/orders`, {
        params: {
          search: orderSearchQuery,
          per_page: 10,
        },
      });
      return response.data;
    },
    enabled: false, // Manual trigger
  });

  const searchResults = Array.isArray(ordersSearchResponse?.data) 
    ? ordersSearchResponse.data 
    : Array.isArray(ordersSearchResponse) 
      ? ordersSearchResponse 
      : [];

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (data: ShipmentFormData) => {
      const payload = {
        carrier_id: data.carrier_id,
        service_code: data.service_code || data.carrier_code,
        warehouse_id: data.warehouse_id,
        order_id: data.order_id || null,
        pickup_address: {
          name: data.pickup_name,
          phone: data.pickup_phone,
          email: data.pickup_email,
          address_1: data.pickup_address_line_1,
          address_2: data.pickup_address_line_2,
          city: data.pickup_city,
          state: data.pickup_state,
          pincode: data.pickup_pincode,
        },
        delivery_address: {
          name: data.delivery_name,
          phone: data.delivery_phone,
          email: data.delivery_email,
          address_1: data.delivery_address_line_1,
          address_2: data.delivery_address_line_2,
          city: data.delivery_city,
          state: data.delivery_state,
          pincode: data.delivery_pincode,
        },
        package_details: {
          weight: parseFloat(data.package_weight),
          length: parseFloat(data.package_length),
          width: parseFloat(data.package_width),
          height: parseFloat(data.package_height),
          value: parseFloat(data.package_value),
          description: data.package_description,
          quantity: parseInt(data.package_quantity),
        },
        payment_mode: data.payment_mode,
        cod_amount: data.payment_mode === 'cod' ? parseFloat(data.cod_amount) : 0,
        invoice_number: data.invoice_number,
        is_fragile: data.is_fragile,
        is_insured: data.is_insured,
        insurance_value: data.insurance_value ? parseFloat(data.insurance_value) : 0,
        remarks: data.remarks,
      };

      const response = await api.post('/shipping/multi-carrier/shipments', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Shipment created successfully!');
      navigate(`/orders/${data.order_id}`);
    },
    onError: (error: any) => {
      // Read 'error' field first (contains actual API error), fallback to 'message' (generic)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to create shipment';
      toast.error(errorMessage);
    },
  });

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle carrier selection
  const handleCarrierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const carrierCode = e.target.value;
    const carrier = carriers.find((c: Carrier) => c.code === carrierCode);
    
    setFormData(prev => ({
      ...prev,
      carrier_code: carrierCode,
      carrier_id: carrier?.id || '',
      warehouse_id: '', // Reset warehouse when carrier changes
    }));
  };

  // Handle warehouse selection
  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = e.target.value;
    const warehouse = carrierWarehouses.find((w: any) => String(w.id) === warehouseId) || 
                       warehouses.find((w: Warehouse) => String(w.id) === warehouseId);
    
    if (warehouse) {
      setFormData(prev => ({
        ...prev,
        warehouse_id: warehouseId,
        pickup_name: warehouse.name || prev.pickup_name,
        pickup_phone: warehouse.phone || prev.pickup_phone,
        pickup_email: warehouse.email || prev.pickup_email,
        pickup_address_line_1: warehouse.address_line_1 || prev.pickup_address_line_1,
        pickup_address_line_2: warehouse.address_line_2 || prev.pickup_address_line_2,
        pickup_city: warehouse.city || prev.pickup_city,
        pickup_state: warehouse.state || prev.pickup_state,
        pickup_pincode: warehouse.pincode || prev.pickup_pincode,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        warehouse_id: warehouseId,
      }));
    }
  };

  // Handle order selection
  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderSearch(false);
    setOrderSearchQuery('');
    
    setFormData(prev => ({
      ...prev,
      order_id: order.id.toString(),
      order_number: order.order_number,
      delivery_name: order.shipping_address.name,
      delivery_phone: order.shipping_address.phone,
      delivery_email: order.shipping_address.email || order.customer_email,
      delivery_address_line_1: order.shipping_address.address_line_1,
      delivery_address_line_2: order.shipping_address.address_line_2 || '',
      delivery_city: order.shipping_address.city,
      delivery_state: order.shipping_address.state,
      delivery_pincode: order.shipping_address.pincode,
      payment_mode: order.payment_method === 'cod' ? 'cod' : 'prepaid',
      cod_amount: order.payment_method === 'cod'
        ? (order.cod_breakdown?.is_advance && order.cod_breakdown?.balance_amount != null
          ? order.cod_breakdown.balance_amount.toString()
          : order.total.toString())
        : '0',
      package_value: order.total.toString(),
      package_description: order.items.map(i => i.product_name).join(', ') || 'Books',
      package_quantity: order.items.reduce((sum, i) => sum + i.quantity, 0).toString(),
    }));
  };

  // Clear order selection
  const handleClearOrder = () => {
    setSelectedOrder(null);
    setFormData(prev => ({
      ...initialFormData,
      carrier_code: prev.carrier_code,
      carrier_id: prev.carrier_id,
      warehouse_id: prev.warehouse_id,
      pickup_name: prev.pickup_name,
      pickup_phone: prev.pickup_phone,
      pickup_email: prev.pickup_email,
      pickup_address_line_1: prev.pickup_address_line_1,
      pickup_address_line_2: prev.pickup_address_line_2,
      pickup_city: prev.pickup_city,
      pickup_state: prev.pickup_state,
      pickup_pincode: prev.pickup_pincode,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.carrier_code) {
      toast.error('Please select a carrier');
      return;
    }
    if (!formData.delivery_pincode) {
      toast.error('Please enter delivery pincode');
      return;
    }
    if (!formData.pickup_pincode) {
      toast.error('Please enter pickup pincode');
      return;
    }
    if (formData.payment_mode === 'cod' && !formData.cod_amount) {
      toast.error('Please enter COD amount for COD orders');
      return;
    }

    createShipmentMutation.mutate(formData);
  };

  // Reset form
  const handleReset = () => {
    setFormData(initialFormData);
    setSelectedOrder(null);
    setOrderSearchQuery('');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Manual Shipment</h1>
            <p className="text-sm text-gray-500">Create a shipment manually with full control over all fields</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Selection Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedOrder ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Order #{selectedOrder.order_number}</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      <p>Customer: {selectedOrder.customer_name}</p>
                      <p>Total: ₹{selectedOrder.total}</p>
                      <p>Payment: {selectedOrder.payment_method.toUpperCase()}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearOrder}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by order number, customer name, or phone..."
                      value={orderSearchQuery}
                      onChange={(e) => {
                        setOrderSearchQuery(e.target.value);
                        if (e.target.value.length >= 2) {
                          searchOrders();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => searchOrders()}
                    disabled={ordersSearchLoading}
                  >
                    {ordersSearchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((order: Order) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => handleOrderSelect(order)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">#{order.order_number}</p>
                            <p className="text-sm text-gray-500">{order.customer_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">₹{order.total}</p>
                            <Badge variant={order.payment_method === 'cod' ? 'warning' : 'success'}>
                              {order.payment_method.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Manual Mode Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="manualMode"
                    checked={isManualMode}
                    onChange={(e) => setIsManualMode(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="manualMode" className="text-sm text-gray-600">
                    Create shipment without order (manual entry)
                  </label>
                </div>
              </div>
            )}

            {/* Manual Order ID Entry */}
            {isManualMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID (Optional)</label>
                  <input
                    type="text"
                    name="order_id"
                    value={formData.order_id}
                    onChange={handleInputChange}
                    placeholder="Enter order ID if applicable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    name="invoice_number"
                    value={formData.invoice_number}
                    onChange={handleInputChange}
                    placeholder="Enter invoice number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carrier Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Carrier Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Carrier <span className="text-red-500">*</span>
                </label>
                <select
                  name="carrier_code"
                  value={formData.carrier_code}
                  onChange={handleCarrierChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a carrier</option>
                  {carriers.filter((c: Carrier) => c.is_active).map((carrier: Carrier) => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pickup Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  name="warehouse_id"
                  value={formData.warehouse_id}
                  onChange={handleWarehouseChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a warehouse</option>
                  <optgroup label="Carrier Registered Warehouses">
                    {carrierWarehouses.map((wh: any) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name || wh.pickup_location} - {wh.pincode}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Warehouses">
                    {warehouses.map((wh: Warehouse) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} - {wh.pincode}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                name="service_code"
                value={formData.service_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Auto-select best service</option>
                <option value="SURFACE">Surface (Standard)</option>
                <option value="EXPRESS">Express (Air)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Pickup Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Contact Name
                </label>
                <input
                  type="text"
                  name="pickup_name"
                  value={formData.pickup_name}
                  onChange={handleInputChange}
                  placeholder="Contact person name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="pickup_phone"
                  value={formData.pickup_phone}
                  onChange={handleInputChange}
                  placeholder="10-digit phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="pickup_email"
                  value={formData.pickup_email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPinned className="h-4 w-4 inline mr-1" />
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pickup_pincode"
                  value={formData.pickup_pincode}
                  onChange={handleInputChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                type="text"
                name="pickup_address_line_1"
                value={formData.pickup_address_line_1}
                onChange={handleInputChange}
                placeholder="Street address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                name="pickup_address_line_2"
                value={formData.pickup_address_line_2}
                onChange={handleInputChange}
                placeholder="Apartment, suite, etc. (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="pickup_city"
                  value={formData.pickup_city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="pickup_state"
                  value={formData.pickup_state}
                  onChange={handleInputChange}
                  placeholder="State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="h-4 w-4 inline mr-1" />
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="delivery_name"
                  value={formData.delivery_name}
                  onChange={handleInputChange}
                  placeholder="Recipient name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="delivery_phone"
                  value={formData.delivery_phone}
                  onChange={handleInputChange}
                  placeholder="10-digit phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  name="delivery_email"
                  value={formData.delivery_email}
                  onChange={handleInputChange}
                  placeholder="Email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPinned className="h-4 w-4 inline mr-1" />
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="delivery_pincode"
                  value={formData.delivery_pincode}
                  onChange={handleInputChange}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="delivery_address_line_1"
                value={formData.delivery_address_line_1}
                onChange={handleInputChange}
                placeholder="Street address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                name="delivery_address_line_2"
                value={formData.delivery_address_line_2}
                onChange={handleInputChange}
                placeholder="Apartment, suite, etc. (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="delivery_city"
                  value={formData.delivery_city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="delivery_state"
                  value={formData.delivery_state}
                  onChange={handleInputChange}
                  placeholder="State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="h-5 w-5" />
              Package Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Weight className="h-4 w-4 inline mr-1" />
                  Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="package_weight"
                  value={toKg(parseFloat(formData.package_weight))}
                  onChange={(e) => setFormData({ ...formData, package_weight: String(toGrams(parseFloat(e.target.value) || 0)) })}
                  placeholder="0.5"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Ruler className="h-4 w-4 inline mr-1" />
                  Length (cm)
                </label>
                <input
                  type="number"
                  name="package_length"
                  value={formData.package_length}
                  onChange={handleInputChange}
                  placeholder="30"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Ruler className="h-4 w-4 inline mr-1" />
                  Width (cm)
                </label>
                <input
                  type="number"
                  name="package_width"
                  value={formData.package_width}
                  onChange={handleInputChange}
                  placeholder="20"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Ruler className="h-4 w-4 inline mr-1" />
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="package_height"
                  value={formData.package_height}
                  onChange={handleInputChange}
                  placeholder="10"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Declared Value (₹)
                </label>
                <input
                  type="number"
                  name="package_value"
                  value={formData.package_value}
                  onChange={handleInputChange}
                  placeholder="Package value"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  name="package_quantity"
                  value={formData.package_quantity}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Description
                </label>
                <input
                  type="text"
                  name="package_description"
                  value={formData.package_description}
                  onChange={handleInputChange}
                  placeholder="Package contents"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  name="payment_mode"
                  value={formData.payment_mode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="prepaid">Prepaid</option>
                  <option value="cod">Cash on Delivery (COD)</option>
                </select>
              </div>

              {formData.payment_mode === 'cod' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    COD Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="cod_amount"
                    value={formData.cod_amount}
                    onChange={handleInputChange}
                    placeholder="Amount to collect"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_fragile"
                  checked={formData.is_fragile}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Fragile Item</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_insured"
                  checked={formData.is_insured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Insured Shipment</span>
              </label>
            </div>

            {formData.is_insured && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Value (₹)
                </label>
                <input
                  type="number"
                  name="insurance_value"
                  value={formData.insurance_value}
                  onChange={handleInputChange}
                  placeholder="Insurance amount"
                  min="0"
                  className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Special Instructions</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Any special instructions for the courier..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createShipmentMutation.isPending}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            {createShipmentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Shipment...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Create Shipment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ManualShipment;