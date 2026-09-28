import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

function formatTimeLeft(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function Cart() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const isLoggedIn = !!localStorage.getItem('customerToken');
  const [customModeIds, setCustomModeIds] = useState([]);
  const [localQtyText, setLocalQtyText] = useState({});
  const [errorMessages, setErrorMessages] = useState({});
  const [flash, setFlash] = useState(false);
  const [selectOverride, setSelectOverride] = useState({});
  const [, setTick] = useState(0);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Re-render every minute so the countdown text stays accurate without
  // needing a manual refresh.
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const activeErrors = Object.keys(errorMessages).filter((id) => errorMessages[id]);
    if (activeErrors.length === 0) return;

    const timer = setTimeout(() => {
      setErrorMessages({});
    }, 3000);

    return () => clearTimeout(timer);
  }, [errorMessages]);

  useEffect(() => {
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 300);
    return () => clearTimeout(timer);
  }, [subtotal]);

  const handleQtySelect = (id, value, stock) => {
    if (value === 'custom') {
      setCustomModeIds((prev) => [...prev, id]);
      setLocalQtyText((prev) => ({ ...prev, [id]: '' }));
      setErrorMessages((prev) => ({ ...prev, [id]: '' }));
    } else {
      const num = Number(value);
      if (stock !== undefined && num > stock) {
        setErrorMessages((prev) => ({ ...prev, [id]: 'The selected quantity is not available' }));
        setSelectOverride((prev) => ({ ...prev, [id]: value }));
        return;
      }
      setErrorMessages((prev) => ({ ...prev, [id]: '' }));
      setCustomModeIds((prev) => prev.filter((cid) => cid !== id));
      setSelectOverride((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      updateQuantity(id, num);
    }
  };

  const handleCustomQtyChange = (id, rawValue, stock) => {
    const cleaned = rawValue.replace(/[^0-9]/g, '');
    setLocalQtyText((prev) => ({ ...prev, [id]: cleaned }));

    const num = Number(cleaned);
    if (cleaned === '') {
      setErrorMessages((prev) => ({ ...prev, [id]: '' }));
      return;
    }
    if (stock !== undefined && num > stock) {
      setErrorMessages((prev) => ({ ...prev, [id]: 'The selected quantity is not available' }));
      return;
    }
    setErrorMessages((prev) => ({ ...prev, [id]: '' }));
    if (num >= 1) {
      updateQuantity(id, num);
    }
  };

  return (
    <div className="cart-page">
      <header className="cart-header">
        <Link to="/" className="cart-logo">Value City</Link>
        <div className="cart-breadcrumb">
          <span className="active">Cart</span>
          <span>&gt;</span>
          <span>Place Order</span>
          <span>&gt;</span>
          <span>Pay</span>
          <span>&gt;</span>
          <span>Order Complete</span>
        </div>
      </header>

      {!isLoggedIn ? (
        <div className="cart-card cart-empty-state">
          <div className="cart-icon">🛒</div>
          <h2>YOUR CART IS EMPTY</h2>
          <p>sign in to view your cart and start shopping</p>
          <Link to="/login" className="btn-primary">SIGN IN / REGISTER</Link>
          <Link to="/" className="btn-secondary">SHOP NOW</Link>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="cart-card cart-empty-state">
          <div className="cart-icon">🛒</div>
          <h2>YOUR CART IS EMPTY</h2>
          <p>looks like you haven't added anything yet</p>
          <Link to="/" className="btn-secondary">SHOP NOW</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-card cart-items">
            <div className="cart-items-heading">ALL ITEMS ({cartItems.length})</div>

            {cartItems.map((item) => {
              const isCustom = customModeIds.includes(item.id) || item.quantity > 5;

              return (
                <div className="cart-item" key={item.id}>
                  <img src={item.image_url} alt={item.name} />
                  <div className="cart-item-details">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">${item.price}</p>
                    {item.expires_at && (
                      <p className="cart-item-timer">⏱ {formatTimeLeft(item.expires_at)}</p>
                    )}
                  </div>

                  <div className="cart-item-qty-wrap">
                    <div className="cart-item-qty">
                      <span className="qty-label">Qty:</span>
                      {isCustom ? (
                        <div className="qty-input-wrap">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="qty-input"
                            placeholder="E.g. 2"
                            value={localQtyText[item.id] !== undefined ? localQtyText[item.id] : ''}
                            onChange={(e) => handleCustomQtyChange(item.id, e.target.value, item.stock_quantity)}
                            onBlur={() => {
                              const typed = localQtyText[item.id];
                              if (!typed) {
                                return;
                              }
                              const num = Number(typed);
                              if (item.stock_quantity !== undefined && num > item.stock_quantity) {
                                return;
                              }
                              if (num < 1) {
                                setLocalQtyText((prev) => ({ ...prev, [item.id]: '' }));
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="qty-caret"
                            onClick={() => {
                              setCustomModeIds((prev) => prev.filter((cid) => cid !== item.id));
                              setLocalQtyText((prev) => ({ ...prev, [item.id]: '' }));
                              setSelectOverride((prev) => ({ ...prev, [item.id]: '' }));
                            }}
                          >
                            ▾
                          </button>
                        </div>
                      ) : (
                        <select
                          className="qty-select"
                          value={selectOverride[item.id] !== undefined ? selectOverride[item.id] : item.quantity}
                          onChange={(e) => handleQtySelect(item.id, e.target.value, item.stock_quantity)}
                          onMouseDown={() => {
                            setSelectOverride((prev) => ({ ...prev, [item.id]: '' }));
                          }}
                        >
                          <option value="" disabled hidden>Select</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                          <option value="custom">Enter Qty:</option>
                        </select>
                      )}
                    </div>
                    {errorMessages[item.id] && (
                      <p className="qty-error">{errorMessages[item.id]}</p>
                    )}
                  </div>

                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <aside className="cart-card order-summary">
            <h3>Order Summary</h3>

            <div className="summary-row">
              <span>Subtotal</span>
              <span className={flash ? 'price-flash' : ''}>${subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row pickup-note">
              <span>📍 Pickup only — Suva store</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span className={flash ? 'price-flash' : ''}>${subtotal.toFixed(2)}</span>
            </div>

            <button className="btn-primary checkout-btn">
              Checkout Now ({cartItems.length})
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Cart;