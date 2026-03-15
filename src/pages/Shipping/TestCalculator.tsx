import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { shippingApi } from '../../api';
import {
  Calculator,
  MapPin,
  Package,
  DollarSign,
  Truck,
  Clock,
  Info,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button, Card, CardContent, Badge } from '../../components';

interface CalculationForm {
  pickup_pincode: string;
  delivery_pincode: string;
  weight: number;
  order_value: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface ShippingResult {
  zone: string;
  zone_name: string;
  gross_weight: number;
  dimensional_weight: number;
  billable_weight: number;
  shipping_options: Array<{
    courier: string;
    base_cost: number;
    final_cost: number;
    is_free_shipping: boolean;
  }>;
  free_shipping_threshold: number;
  free_shipping_enabled: boolean;
  delivery_estimate: string;
  cod_available: boolean;
}

const TestCalculator: React.FC = () => {
  const [formData, setFormData] = useState<CalculationForm>({
    pickup_pincode: '400001',
    delivery_pincode: '110001',
    weight: 1.5,
    order_value: 999,
    dimensions: {
      length: 20,
      width: 14,
      height: 5,
    },
  });

  const [result, setResult] = useState<ShippingResult | null>(null);

  const calculateMutation = useMutation({
    mutationFn: shippingApi.testCalculation,
    onSuccess: (data) => {
      console.log('Shipping calculation response:', data);

      if (data.success) {
        // Backend returns data in 'shipping_calculation' key
        const shippingData = (data as any).shipping_calculation;
        if (shippingData) {
          console.log('Setting result:', shippingData);
          setResult(shippingData);
          toast.success('Calculation completed successfully');
        } else {
          console.error('No shipping_calculation in response:', data);
          toast.error('No calculation data received');
        }
      } else {
        console.error('Calculation failed:', data);
        toast.error((data as any).message || 'Calculation failed');
      }
    },
    onError: (error: any) => {
      console.error('Calculation error:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate shipping');
    },
  });

  const handleCalculate = () => {
    calculateMutation.mutate(formData);
  };

  const getZoneBadgeVariant = (zone: string): 'success' | 'info' | 'purple' | 'warning' | 'error' | 'default' => {
    const variants: Record<string, 'success' | 'info' | 'purple' | 'warning' | 'error' | 'default'> = {
      A: 'success',
      B: 'info',
      C: 'purple',
      D: 'warning',
      E: 'error',
    };
    return variants[zone] || 'default';
  };

  const examplePincodes = [
    { pickup: '400001', delivery: '400020', description: 'Same City (Mumbai)' },
    { pickup: '110001', delivery: '122001', description: 'Same State (Delhi NCR)' },
    { pickup: '400001', delivery: '110001', description: 'Metro to Metro' },
    { pickup: '400001', delivery: '560001', description: 'Rest of India' },
    { pickup: '400001', delivery: '781001', description: 'Northeast (Assam)' },
  ];

  const loadExample = (example: typeof examplePincodes[0]) => {
    setFormData({
      ...formData,
      pickup_pincode: example.pickup,
      delivery_pincode: example.delivery,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Shipping Calculator</h1>
        <p className="text-sm text-gray-600 mt-1">Test shipping calculations with different parameters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Calculation Parameters</h3>

            <div className="space-y-4">
              {/* Pincodes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Pincode
                  </label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={formData.pickup_pincode}
                      onChange={(e) => setFormData({ ...formData, pickup_pincode: e.target.value })}
                      className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Pincode
                  </label>
                  <div className="relative">
                    <MapPin className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={formData.delivery_pincode}
                      onChange={(e) => setFormData({ ...formData, delivery_pincode: e.target.value })}
                      className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Weight and Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                    className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order_value}
                    onChange={(e) => setFormData({ ...formData, order_value: parseFloat(e.target.value) })}
                    className="px-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions (cm) - Optional
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Length"
                    value={formData.dimensions.length}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) },
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="number"
                    placeholder="Width"
                    value={formData.dimensions.width}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) },
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <input
                    type="number"
                    placeholder="Height"
                    value={formData.dimensions.height}
                    onChange={(e) => setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) },
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Example Pincodes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Examples
                </label>
                <div className="space-y-1">
                  {examplePincodes.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => loadExample(example)}
                      className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          {example.pickup} → {example.delivery}
                        </span>
                        <span className="text-xs text-gray-500">{example.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <Button
                className="w-full"
                onClick={handleCalculate}
                loading={calculateMutation.isPending}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Shipping
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Calculation Results</h3>

            {result ? (
              <div className="space-y-4">
                {/* Zone Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Shipping Zone</span>
                    <Badge variant={"info"}>
                      Zone {result.zone}: {result.zone_name}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{result.delivery_estimate}</span>
                  </div>
                </div>

                {/* Weight Details */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Weight Calculation</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Gross Weight</p>
                      <p className="font-medium mt-1">{result.gross_weight} kg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500">Dimensional</p>
                      <p className="font-medium mt-1">{result.dimensional_weight} kg</p>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-3">
                      <p className="text-xs text-primary-600">Billable</p>
                      <p className="font-medium text-primary-900 mt-1">{result.billable_weight} kg</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Options */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Shipping Options</h4>
                  {result.shipping_options.map((option, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium">{option.courier}</span>
                        </div>
                        <div className="text-right">
                          {option.is_free_shipping ? (
                            <>
                              <p className="text-sm line-through text-gray-400">₹{option.base_cost}</p>
                              <p className="text-sm font-medium text-green-600">FREE</p>
                            </>
                          ) : (
                            <p className="text-sm font-medium">₹{option.final_cost}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Free Shipping Info */}
                <Card className={result.free_shipping_enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}>
                  <CardContent className="p-3">
                    <div className="flex items-start">
                      <Info className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 ${result.free_shipping_enabled ? 'text-green-600' : 'text-gray-500'}`} />
                      <div className="text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <p className={`font-medium ${result.free_shipping_enabled ? 'text-green-900' : 'text-gray-700'}`}>
                            Free Shipping for Zone {result.zone}
                          </p>
                          <Badge variant={result.free_shipping_enabled ? 'success' : 'error'}>
                            {result.free_shipping_enabled ? 'ENABLED' : 'DISABLED'}
                          </Badge>
                        </div>
                        {result.free_shipping_enabled ? (
                          <p className="text-green-700">
                            Orders above ₹{result.free_shipping_threshold} qualify for free shipping
                          </p>
                        ) : (
                          <p className="text-gray-600">
                            Free shipping is currently disabled for this zone. Threshold: ₹{result.free_shipping_threshold}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* COD Availability */}
                <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">COD Available</span>
                  <Badge variant={result.cod_available ? 'success' : 'error'}>
                    {result.cod_available ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Calculator className="h-12 w-12 mb-3" />
                <p className="text-sm">Enter parameters and click calculate</p>
                <p className="text-xs mt-1">Results will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestCalculator;