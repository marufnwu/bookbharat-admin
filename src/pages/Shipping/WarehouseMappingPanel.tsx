import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/axios';
import { toast } from '../../utils/toast';
import {
  Warehouse,
  Building2,
  MapPin,
  RefreshCw,
  Link2,
  Unlink,
  PlusCircle,
  AlertCircle,
  Info,
  CheckCircle,
  Star,
  Download,
  ArrowRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarrierIdentity {
  id: number | null;
  code: string;
  name: string;
}

/** A warehouse registered on the carrier side. */
interface CarrierWarehouseRow {
  id: string;
  name?: string;
  carrier_warehouse_name?: string;
  alias?: string;
  address?: string;
  address_1?: string;
  address_2?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  contact_person?: string;
  contact_person_name?: string;
  client_name?: string;
  note?: string;
  is_default?: boolean;
  mapped_to_warehouse_id?: number | null;
  [key: string]: any;
}

/** A warehouse in our own system. */
interface SystemWarehouseRow {
  warehouse_id: number;
  name: string;
  code?: string;
  address?: string;
  address_2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  contact_person?: string;
  is_default?: boolean;
  is_active?: boolean;
  is_mapped?: boolean;
  mapping?: {
    carrier_warehouse_id?: string | null;
    carrier_warehouse_name?: string | null;
    is_enabled?: boolean;
  } | null;
}

interface MappingOverview {
  success: boolean;
  carrier_code?: string;
  carrier_name?: string;
  requirement_type?: 'registered_id' | 'registered_alias' | 'full_address' | string;
  capabilities?: {
    can_fetch_warehouses?: boolean;
    can_create_warehouses?: boolean;
    can_update_warehouses?: boolean;
  };
  system_warehouses?: SystemWarehouseRow[];
  carrier_warehouses?: CarrierWarehouseRow[];
  carrier_warehouses_error?: string | null;
}

interface WarehouseMappingPanelProps {
  carrier: CarrierIdentity;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick the first non-empty string, tolerating the differing carrier shapes. */
const firstText = (...values: Array<string | undefined | null>): string => {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
};

const displayName = (row: CarrierWarehouseRow): string =>
  firstText(row.name, row.carrier_warehouse_name, row.alias, row.warehouse_name) || `Warehouse ${row.id}`;

const displayAddress = (row: CarrierWarehouseRow): string =>
  firstText(row.address, row.address_line1, row.address_1, row.address_2);

/** "Kolkata, West Bengal - 700009", skipping anything missing. */
const cityStatePincode = (parts: { city?: string; state?: string; pincode?: string; postal_code?: string }) => {
  const city = firstText(parts.city);
  const state = firstText(parts.state);
  const pincode = firstText(parts.pincode, parts.postal_code);

  return [city, state].filter(Boolean).join(', ') + (pincode ? ` - ${pincode}` : '');
};

const MANUAL_OPTION = '__manual__';

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500';

const PRIMARY_BUTTON_CLASS =
  'px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed';

const SECONDARY_BUTTON_CLASS =
  'px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50';

const LINK_BUTTON_CLASS = 'text-sm text-blue-600 hover:text-blue-700';

// ---------------------------------------------------------------------------
// Warehouse Mapping Panel
// ---------------------------------------------------------------------------

/**
 * Side-by-side view of our system warehouses and the warehouses registered on
 * the carrier, with mapping between them.
 *
 * Backed by a single endpoint:
 *   GET /shipping/multi-carrier/carriers/{id}/warehouses/mapping-overview
 *
 * which returns both sides plus the carrier's capabilities, so this panel does
 * not have to stitch the system warehouse list and the carrier warehouse list
 * together from two calls. The capabilities decide which actions to offer:
 * "create in carrier" is only shown when the carrier supports it.
 */
const WarehouseMappingPanel: React.FC<WarehouseMappingPanelProps> = ({ carrier }) => {
  const queryClient = useQueryClient();

  // Warehouse id being mapped. `{ systemId, carrierId }` pre-selects a carrier
  // warehouse when the operator started from the carrier column.
  const [editing, setEditing] = useState<{ systemId: number; carrierId?: string } | null>(null);
  const [selectedCarrierWarehouse, setSelectedCarrierWarehouse] = useState<string>('');
  const [mappingName, setMappingName] = useState<string>('');
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [registerName, setRegisterName] = useState<string>('');

  const queryKey = ['warehouse-mapping-overview', carrier.id];

  const { data, isLoading, isFetching, refetch } = useQuery<MappingOverview>({
    queryKey,
    queryFn: async () => {
      const response = await api.get(
        `/shipping/multi-carrier/carriers/${carrier.id}/warehouses/mapping-overview`
      );
      return (response.data || {}) as MappingOverview;
    },
    enabled: carrier.id != null,
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    queryClient.invalidateQueries({ queryKey: ['carrier-warehouse-mappings', carrier.id] });
  };

  const systemWarehouses = data?.system_warehouses || [];
  const carrierWarehouses = data?.carrier_warehouses || [];
  const capabilities = data?.capabilities || {};
  const carrierError = data?.carrier_warehouses_error || null;

  const systemById = systemWarehouses.reduce<Record<number, SystemWarehouseRow>>((acc, warehouse) => {
    acc[warehouse.warehouse_id] = warehouse;
    return acc;
  }, {});

  // -- mapping (upsert) --------------------------------------------------
  const saveMappingMutation = useMutation({
    mutationFn: async (input: { systemId: number; carrierWarehouseId: string | null; name: string }) => {
      return api.put(
        `/shipping/multi-carrier/carriers/${carrier.id}/warehouses/${input.systemId}`,
        {
          carrier_warehouse_name: input.name,
          // A name-only mapping cannot be resolved once the carrier has more
          // than one registered warehouse, so send the id whenever we know it.
          ...(input.carrierWarehouseId ? { carrier_warehouse_id: input.carrierWarehouseId } : {}),
        }
      );
    },
    onSuccess: (_response, variables) => {
      toast.success(`Mapped to "${variables.name}"`);
      setEditing(null);
      invalidate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save mapping');
    },
  });

  // -- unmap -------------------------------------------------------------
  const removeMappingMutation = useMutation({
    mutationFn: async (systemId: number) => {
      return api.delete(`/shipping/multi-carrier/carriers/${carrier.id}/warehouses/${systemId}`);
    },
    onSuccess: () => {
      toast.success('Warehouse unmapped');
      setEditing(null);
      invalidate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove mapping');
    },
  });

  // -- create in carrier -------------------------------------------------
  const registerMutation = useMutation({
    mutationFn: async (input: { systemId: number; name: string }) => {
      return api.post(
        `/shipping/multi-carrier/carriers/${carrier.id}/warehouses/${input.systemId}/register`,
        { carrier_warehouse_name: input.name }
      );
    },
    onSuccess: (response: any) => {
      const createdId = response?.data?.carrier_warehouse_id;
      toast.success(
        createdId
          ? `Registered in ${carrier.name} as "${response.data.alias}" (id ${createdId})`
          : `Registered in ${carrier.name}`
      );
      setRegisteringId(null);
      setRegisterName('');
      invalidate();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Failed to register warehouse in ${carrier.name}`);
    },
  });

  // -- helpers -----------------------------------------------------------

  const openMappingForSystem = (systemId: number, presetCarrierId?: string) => {
    const system = systemById[systemId];
    const preset = carrierWarehouses.find((row) => row.id === presetCarrierId);

    setEditing({ systemId, carrierId: presetCarrierId });
    setSelectedCarrierWarehouse(presetCarrierId || '');
    setMappingName(
      firstText(
        preset ? displayName(preset) : undefined,
        system?.mapping?.carrier_warehouse_name,
        system?.name
      )
    );
  };

  const openMappingForCarrier = (carrierWarehouseId: string) => {
    const preset = carrierWarehouses.find((row) => row.id === carrierWarehouseId);
    const systemId = preset?.mapped_to_warehouse_id;

    if (systemId == null) {
      toast('Select a system warehouse to assign it to', { icon: 'ℹ️' });
      return;
    }

    openMappingForSystem(systemId, carrierWarehouseId);
  };

  const handleSelectCarrierWarehouse = (value: string) => {
    setSelectedCarrierWarehouse(value);

    if (value && value !== MANUAL_OPTION) {
      const preset = carrierWarehouses.find((row) => row.id === value);
      if (preset) {
        setMappingName(displayName(preset));
      }
    }
  };

  // -- render ------------------------------------------------------------

  if (carrier.id == null) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">Carrier not initialized</h4>
            <p className="mt-1 text-sm text-yellow-700">
              {carrier.name} is defined in configuration but has no database record yet. Use{' '}
              <strong>Initialize</strong> on the carriers list to create it before mapping warehouses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Warehouse Mapping</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pickups are dispatched from the <strong>carrier</strong> warehouse you map to, so the addresses
            below should match the real dispatch location.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className={SECONDARY_BUTTON_CLASS + ' flex items-center'}
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading warehouses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* ---------------- Our warehouses ---------------- */}
          <section
            data-testid="warehouse-column-system"
            className="bg-white border border-gray-200 rounded-lg"
          >
            <header className="flex items-center px-4 py-3 border-b border-gray-200">
              <Building2 className="h-4 w-4 text-gray-400 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Our Warehouses</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {systemWarehouses.length}
              </span>
            </header>

            {systemWarehouses.length === 0 ? (
              <div className="text-center py-8 px-4 text-gray-500">
                <Warehouse className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No warehouses configured</p>
                <p className="text-xs mt-1">Create a warehouse first to map it to this carrier</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {systemWarehouses.map((warehouse) => {
                  const isEditingThis = editing?.systemId === warehouse.warehouse_id;
                  const mapping = warehouse.mapping;
                  const isSaving = saveMappingMutation.isPending && isEditingThis;

                  return (
                    <li key={warehouse.warehouse_id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="font-medium text-gray-900 truncate">{warehouse.name}</p>
                            {warehouse.is_default && (
                              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Default</span>
                            )}
                            {warehouse.is_active === false && (
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">Inactive</span>
                            )}
                          </div>
                          {warehouse.address && (
                            <p className="text-sm text-gray-600 mt-1">{warehouse.address}</p>
                          )}
                          {(warehouse.city || warehouse.pincode) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {cityStatePincode(warehouse)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Current mapping */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {mapping ? (
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500">Mapped to</p>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {firstText(mapping.carrier_warehouse_name) || 'Unnamed carrier warehouse'}
                                </p>
                                {mapping.carrier_warehouse_id ? (
                                  <p className="text-xs text-gray-500 font-mono">
                                    id: {mapping.carrier_warehouse_id}
                                  </p>
                                ) : (
                                  <p className="text-xs text-yellow-600 mt-0.5">
                                    Name only — re-map to store the carrier warehouse id
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openMappingForSystem(warehouse.warehouse_id)}
                                  className={LINK_BUTTON_CLASS}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeMappingMutation.mutate(warehouse.warehouse_id)}
                                  disabled={removeMappingMutation.isPending}
                                  className="inline-flex items-center text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                                >
                                  <Unlink className="h-3.5 w-3.5 mr-1" />
                                  Unmap
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openMappingForSystem(warehouse.warehouse_id)}
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                            >
                              <Link2 className="h-3.5 w-3.5 mr-1" />
                              Map to {carrier.name}
                            </button>

                            {capabilities.can_create_warehouses && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRegisteringId(warehouse.warehouse_id);
                                  setRegisterName(warehouse.name);
                                }}
                                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                              >
                                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                Create in {carrier.name}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Create-in-carrier form */}
                      {registeringId === warehouse.warehouse_id && (
                        <div className="mt-3 space-y-2 bg-gray-50 border border-gray-200 rounded-md p-3">
                          <label className="block text-xs font-medium text-gray-700">
                            Register as in {carrier.name}
                          </label>
                          <input
                            type="text"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            placeholder="Name to register with the carrier"
                            className={INPUT_CLASS}
                          />
                          <p className="text-xs text-gray-500">
                            This creates a new pickup location in {carrier.name} using this warehouse's address,
                            then maps it automatically.
                          </p>
                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() =>
                                registerMutation.mutate({
                                  systemId: warehouse.warehouse_id,
                                  name: registerName.trim() || warehouse.name,
                                })
                              }
                              disabled={registerMutation.isPending}
                              className={PRIMARY_BUTTON_CLASS + ' flex items-center'}
                            >
                              {registerMutation.isPending ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                                  Registering...
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="h-4 w-4 mr-1.5" />
                                  Create &amp; map
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRegisteringId(null);
                                setRegisterName('');
                              }}
                              className={SECONDARY_BUTTON_CLASS}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Mapping form */}
                      {isEditingThis && (
                        <div className="mt-3 space-y-2 bg-gray-50 border border-gray-200 rounded-md p-3">
                          {capabilities.can_fetch_warehouses && carrierWarehouses.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                {carrier.name} warehouse
                              </label>
                              <select
                                value={selectedCarrierWarehouse}
                                onChange={(e) => handleSelectCarrierWarehouse(e.target.value)}
                                className={INPUT_CLASS}
                              >
                                <option value={MANUAL_OPTION}>
                                  {selectedCarrierWarehouse === MANUAL_OPTION
                                    ? 'Enter a name manually'
                                    : '-- Select a registered warehouse --'}
                                </option>
                                {carrierWarehouses.map((row) => (
                                  <option key={row.id} value={row.id}>
                                    {displayName(row)}
                                    {row.is_default ? ' (default)' : ''}
                                    {row.mapped_to_warehouse_id ? ' — already mapped' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Name / alias recorded for {carrier.name}
                            </label>
                            <input
                              type="text"
                              value={mappingName}
                              onChange={(e) => setMappingName(e.target.value)}
                              placeholder="Enter the warehouse name as registered with the carrier"
                              className={INPUT_CLASS}
                            />
                          </div>

                          <p className="text-xs text-gray-500">
                            The carrier warehouse id is stored alongside this name, so {carrier.name} always
                            knows which pickup location to use — even after you add a second warehouse.
                          </p>

                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                const name = mappingName.trim();
                                if (!name) {
                                  toast.error('Please enter a warehouse name');
                                  return;
                                }
                                saveMappingMutation.mutate({
                                  systemId: warehouse.warehouse_id,
                                  carrierWarehouseId:
                                    selectedCarrierWarehouse && selectedCarrierWarehouse !== MANUAL_OPTION
                                      ? selectedCarrierWarehouse
                                      : null,
                                  name,
                                });
                              }}
                              disabled={isSaving}
                              className={PRIMARY_BUTTON_CLASS + ' flex items-center'}
                            >
                              {isSaving ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1.5" />
                                  Save mapping
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditing(null)}
                              className={SECONDARY_BUTTON_CLASS}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ---------------- Carrier warehouses ---------------- */}
          <section
            data-testid="warehouse-column-carrier"
            className="bg-white border border-gray-200 rounded-lg"
          >
            <header className="flex items-center px-4 py-3 border-b border-gray-200">
              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">{carrier.name} Warehouses</h4>
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {carrierWarehouses.length}
              </span>
            </header>

            {/* Non-fatal: the system side is still usable when this fails. */}
            {carrierError && (
              <div className="m-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="ml-2 text-xs text-yellow-800">{carrierError}</p>
                </div>
              </div>
            )}

            {!capabilities.can_fetch_warehouses ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <Download className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">{carrier.name} does not expose a warehouse list via API</p>
                <p className="text-xs mt-1">Register pickups in the {carrier.name} portal, then map by name</p>
              </div>
            ) : carrierWarehouses.length === 0 ? (
              <div className="text-center py-8 px-4 text-gray-500">
                <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No warehouses registered with {carrier.name}</p>
                {capabilities.can_create_warehouses && (
                  <p className="text-xs mt-1">
                    Use <strong>Create in {carrier.name}</strong> on the left to add one
                  </p>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {carrierWarehouses.map((row) => {
                  const usedBy = row.mapped_to_warehouse_id ? systemById[row.mapped_to_warehouse_id] : null;
                  const address = displayAddress(row);

                  return (
                    <li key={row.id || displayName(row)} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <p className="font-medium text-gray-900 truncate">{displayName(row)}</p>
                            {row.is_default && (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded">
                                <Star className="h-3 w-3 mr-1" />
                                Account default
                              </span>
                            )}
                          </div>
                          {row.id && <p className="text-xs text-gray-500 font-mono mt-0.5">id: {row.id}</p>}
                          {address && <p className="text-sm text-gray-600 mt-1">{address}</p>}
                          {(row.city || row.pincode || row.postal_code) && (
                            <p className="text-xs text-gray-500 mt-0.5">{cityStatePincode(row)}</p>
                          )}
                          {firstText(row.contact_person, row.contact_person_name, row.client_name) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {firstText(row.contact_person, row.contact_person_name, row.client_name)}
                              {firstText(row.phone) ? ` · ${row.phone}` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {usedBy ? (
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-gray-600 flex items-center min-w-0">
                              <ArrowRight className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-gray-400" />
                              <span className="truncate">Mapped to {usedBy.name}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => openMappingForCarrier(row.id)}
                              className={`${LINK_BUTTON_CLASS} flex-shrink-0`}
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Not used by any warehouse yet</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">How this works</h4>
            <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>
                Orders are pushed to {carrier.name} with the carrier warehouse you map, so the pickup
                address printed on the label is the carrier's registered one — not the address on the left.
              </li>
              {capabilities.can_create_warehouses ? (
                <li>
                  <strong>Create in {carrier.name}</strong> registers a new pickup location on the carrier
                  using that warehouse's address, then maps it automatically.
                </li>
              ) : (
                <li>
                  {carrier.name} has no warehouse-creation API. Register the pickup location in their
                  portal first, then map it by name.
                </li>
              )}
              <li>Mapping one warehouse does not stop you mapping a second one.</li>
              <li>Changes apply to new shipments only.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseMappingPanel;
