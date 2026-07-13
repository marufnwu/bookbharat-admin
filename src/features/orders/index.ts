/**
 * Public barrel for the orders feature module.
 * Re-exports helpers + constants so consumers can do:
 *   import { formatCurrency, getOrderPhone } from '@/features/orders';
 */

export * from './utils/format';
export * from './utils/phone';
export * from './utils/address';
export * from './constants/transitions';
export * from './constants/couriers';
export * from './selectors/order';