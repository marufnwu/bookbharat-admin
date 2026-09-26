import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../../api/axios';
import WarehouseMappingPanel from './WarehouseMappingPanel';

jest.mock('../../api/axios', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

const OVERVIEW = {
  success: true,
  carrier_code: 'SHIPWAY',
  carrier_name: 'Shipway',
  requirement_type: 'registered_id',
  capabilities: {
    can_fetch_warehouses: true,
    can_create_warehouses: true,
    can_update_warehouses: false,
  },
  system_warehouses: [
    {
      warehouse_id: 1,
      name: 'Office',
      code: 'OFFICE',
      address: 'Bright Academy, 35/2 Beniatola Lane',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700009',
      is_default: true,
      is_active: true,
      is_mapped: false,
      mapping: null,
    },
    {
      warehouse_id: 2,
      name: 'Annex',
      code: 'ANNEX',
      address: '22 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700016',
      is_default: false,
      is_active: true,
      is_mapped: true,
      mapping: {
        carrier_warehouse_id: '108703',
        carrier_warehouse_name: 'Book Bharat',
        is_enabled: true,
      },
    },
  ],
  carrier_warehouses: [
    {
      id: '108703',
      name: 'Book Bharat',
      address: '42A,Beniatola lane',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700009',
      contact_person: 'Uttam Sikder',
      phone: '9062686255',
      is_default: true,
      mapped_to_warehouse_id: 2,
    },
    {
      id: '20001',
      name: 'Book Bharat Warehouse II',
      address: 'Salt Lake Sector V',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700091',
      is_default: false,
      mapped_to_warehouse_id: null,
    },
  ],
  carrier_warehouses_error: null,
};

const CARRIER = { id: 7, code: 'SHIPWAY', name: 'Shipway' };

function renderPanel(carrier: any = CARRIER) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <WarehouseMappingPanel carrier={carrier} />
    </QueryClientProvider>
  );
}

/**
 * Both columns legitimately render a carrier warehouse name and id (once in
 * the carrier list, once in the mapping it is bound to), so assertions are
 * scoped to the column they are about.
 *
 * The columns only mount once the overview query resolves, so the test id is
 * awaited.
 */
const inSystemColumn = async () => within(await screen.findByTestId('warehouse-column-system'));
const inCarrierColumn = async () => within(await screen.findByTestId('warehouse-column-carrier'));

beforeEach(() => {
  jest.clearAllMocks();
  mockedApi.get.mockResolvedValue({ data: OVERVIEW } as any);
  mockedApi.put.mockResolvedValue({ data: { success: true } } as any);
  mockedApi.post.mockResolvedValue({
    data: { success: true, alias: 'Book Bharat', carrier_warehouse_id: '30003' },
  } as any);
  mockedApi.delete.mockResolvedValue({ data: { success: true } } as any);
});

describe('WarehouseMappingPanel', () => {
  it('fetches the side-by-side mapping overview', async () => {
    renderPanel();

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith(
        '/shipping/multi-carrier/carriers/7/warehouses/mapping-overview'
      );
    });
  });

  it('shows the system warehouses on the left and the carrier warehouses on the right', async () => {
    renderPanel();

    expect((await inSystemColumn()).getByText('Office')).toBeInTheDocument();
    expect((await inSystemColumn()).getByText('Bright Academy, 35/2 Beniatola Lane')).toBeInTheDocument();
    expect((await inSystemColumn()).getByText('Annex')).toBeInTheDocument();

    expect((await inCarrierColumn()).getByText('Book Bharat')).toBeInTheDocument();
    expect((await inCarrierColumn()).getByText('Book Bharat Warehouse II')).toBeInTheDocument();
    expect((await inCarrierColumn()).getByText('id: 108703')).toBeInTheDocument();
  });

  it('annotates each carrier warehouse with the system warehouse using it', async () => {
    renderPanel();
    expect((await inCarrierColumn()).getByText('Mapped to Annex')).toBeInTheDocument();
    expect((await inCarrierColumn()).getByText('Not used by any warehouse yet')).toBeInTheDocument();
  });

  it('flags a name-only mapping so the operator re-maps it', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        ...OVERVIEW,
        system_warehouses: [
          {
            ...OVERVIEW.system_warehouses[1],
            mapping: { carrier_warehouse_id: null, carrier_warehouse_name: 'Book Bharat', is_enabled: true },
          },
        ],
        carrier_warehouses: [],
      },
    } as any);

    renderPanel();
    expect((await inSystemColumn()).getByText('Name only — re-map to store the carrier warehouse id')).toBeInTheDocument();
  });

  it('offers create-in-carrier when the carrier supports it', async () => {
    renderPanel();
    expect((await inSystemColumn()).getByText('Create in Shipway')).toBeInTheDocument();
  });

  it('hides create-in-carrier and explains manual registration when unsupported', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        ...OVERVIEW,
        capabilities: {
          can_fetch_warehouses: false,
          can_create_warehouses: false,
          can_update_warehouses: false,
        },
        carrier_warehouses: [],
      },
    } as any);

    renderPanel();

    expect(
      await screen.findByText('Shipway does not expose a warehouse list via API')
    ).toBeInTheDocument();
    expect(screen.queryByText('Create in Shipway')).not.toBeInTheDocument();
  });

  it('sends the carrier warehouse id when a mapping is saved', async () => {
    renderPanel();
    await userEvent.click(await (await inSystemColumn()).findByText('Map to Shipway'));

    await userEvent.selectOptions(await screen.findByRole('combobox'), '20001');
    await userEvent.click(screen.getByText('Save mapping'));

    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith(
        '/shipping/multi-carrier/carriers/7/warehouses/1',
        {
          carrier_warehouse_name: 'Book Bharat Warehouse II',
          carrier_warehouse_id: '20001',
        }
      );
    });
  });

  it('creates the warehouse in the carrier and maps it', async () => {
    renderPanel();
    await userEvent.click(await (await inSystemColumn()).findByText('Create in Shipway'));
    await userEvent.click(await screen.findByText('Create & map'));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/shipping/multi-carrier/carriers/7/warehouses/1/register',
        { carrier_warehouse_name: 'Office' }
      );
    });
  });

  it('unmaps a warehouse', async () => {
    renderPanel();
    await userEvent.click(await (await inSystemColumn()).findByText('Unmap'));

    await waitFor(() => {
      expect(mockedApi.delete).toHaveBeenCalledWith(
        '/shipping/multi-carrier/carriers/7/warehouses/2'
      );
    });
  });

  it('warns but still renders when the carrier warehouse list fails', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        ...OVERVIEW,
        carrier_warehouses: [],
        carrier_warehouses_error: 'Unauthorized',
      },
    } as any);

    renderPanel();
    // Non-fatal: the system side is still usable.
    expect((await inSystemColumn()).getByText('Office')).toBeInTheDocument();
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('asks the admin to initialize a carrier that has no database row', async () => {
    renderPanel({ id: null, code: 'SHIPWAY', name: 'Shipway' });

    expect(await screen.findByText('Carrier not initialized')).toBeInTheDocument();
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});
