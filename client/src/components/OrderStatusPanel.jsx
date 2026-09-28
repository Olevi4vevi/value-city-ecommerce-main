import { ORDER_STEPS, STATUS_MESSAGE } from '../constants/orderStatus';
import './OrderStatusPanel.css';

// Local copy of the condition-grade labels used elsewhere on the storefront
// (kept inline here so this component has no dependency on files that may
// not exist yet on every branch).
const GRADE_LABEL = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
};

// Shown inside an expanded order row in Order History. The step tracker and
// the "picked up on" receipt only fill in once the customer has actually
// collected the order (status === 'completed'); a cancelled or still-in-
// progress order shows a placeholder instead, per the professor's feedback
// that pickup-confirmed vs. not-yet/cancelled should look visibly different.
export default function OrderStatusPanel({ order, items }) {
  const isCancelled = order.status === 'cancelled';
  const isPickedUp = order.status === 'completed';
  const currentIndex = ORDER_STEPS.findIndex((s) => s.key === order.status);
  const progress = currentIndex <= 0 ? 0 : (currentIndex / (ORDER_STEPS.length - 1)) * 100;

  return (
    <div className="osp">
      {isCancelled ? (
        <div className="osp-cancelled">
          <span className="osp-x" aria-hidden="true">✕</span>
          <p>{STATUS_MESSAGE.cancelled}</p>
        </div>
      ) : (
        <>
          <div className="osp-steps" style={{ '--osp-progress': `${progress}%` }}>
            {ORDER_STEPS.map((step, i) => (
              <div key={step.key} className={`osp-step${i <= currentIndex ? ' is-done' : ''}`}>
                <span className="osp-dot">{i <= currentIndex ? '✓' : i + 1}</span>
                <span className="osp-label">{step.label}</span>
              </div>
            ))}
          </div>
          <p className="osp-message">{STATUS_MESSAGE[order.status] || STATUS_MESSAGE.pending}</p>
        </>
      )}

      <div className="osp-receipt">
        <span className="eyebrow">Receipt</span>
        {isPickedUp ? (
          <div className="osp-receipt-filled">
            <div className="osp-receipt-row">
              <span>Order number</span>
              <span>#{order.order_id}</span>
            </div>
            <div className="osp-receipt-row">
              <span>Picked up on</span>
              <span>{new Date(order.order_date).toLocaleDateString()}</span>
            </div>

            {items.length > 0 && (
              <div className="osp-receipt-items">
                {items.map((item, idx) => (
                  <div key={idx} className="osp-receipt-item">
                    <span>
                      {item.item_name} ({item.size}, {GRADE_LABEL[item.condition_grade] || item.condition_grade}) × {item.quantity}
                    </span>
                    <span>${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="osp-receipt-row osp-receipt-total">
              <span>Total paid</span>
              <span>${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <p className="osp-receipt-empty">
            {isCancelled
              ? 'No receipt was issued for this order.'
              : "Your receipt will be filled in here once this order's been picked up."}
          </p>
        )}
      </div>
    </div>
  );
}
