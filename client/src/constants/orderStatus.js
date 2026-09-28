// Shared order-status wording for the customer-facing Order History views.
// Value City is Suva pickup only -- the stored `status` enum still has a
// `shipped` value (shared with the admin reports module, which keys its
// charts off the raw value), but no customer-facing screen should ever
// print that word, so every display surface goes through this map instead.
export const ORDER_STEPS = [
  { key: 'pending', label: 'Order placed' },
  { key: 'paid', label: 'Payment confirmed' },
  { key: 'shipped', label: 'Ready for pickup' },
  { key: 'completed', label: 'Picked up' },
];

export const STATUS_LABEL = {
  pending: 'Placed',
  paid: 'Paid',
  shipped: 'Ready for pickup',
  completed: 'Picked up',
  cancelled: 'Cancelled',
};

export const STATUS_MESSAGE = {
  pending: "Order received — we're getting it ready.",
  paid: 'Payment confirmed — packing your item(s).',
  shipped: 'Ready for pickup — swing by whenever suits you.',
  completed: 'Picked up — thanks for shopping with us!',
  cancelled: "This order's been cancelled. Let us know if we can help.",
};
