// Use optimized compat service with indexes enabled
import productServiceCompat from './productServiceCompat';

export type { Product, Bid } from './productServiceCompat';

// Export the optimized service now that indexes are ready
export default productServiceCompat;