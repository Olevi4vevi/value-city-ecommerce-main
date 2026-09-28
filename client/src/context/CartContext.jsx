import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCart, addToCartApi, removeFromCartApi } from '../api/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!localStorage.getItem('customerToken');

  const refreshCart = useCallback(async () => {
    if (!isLoggedIn) {
      setCartItems([]);
      setLoading(false);
      return;
    }
    try {
      const res = await getCart();
      // Map product_id -> id so the rest of the app (Cart.jsx, etc.) can
      // keep using item.id like before
      const mapped = res.data.map((row) => ({
        id: row.product_id,
        name: row.name,
        price: row.price,
        image_url: row.image_url,
        stock_quantity: row.stock_quantity,
        quantity: row.quantity,
        expires_at: row.expires_at,
      }));
      setCartItems(mapped);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product) => {
    const existing = cartItems.find((item) => item.id === product.id);
    const newQuantity = existing ? existing.quantity + 1 : 1;
    try {
      await addToCartApi(product.id, newQuantity);
      await refreshCart();
    } catch (err) {
      console.error('Failed to add to cart:', err);
      throw err;
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) {
      return removeFromCart(id);
    }
    try {
      await addToCartApi(id, newQuantity);
      await refreshCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
      throw err;
    }
  };

  const removeFromCart = async (id) => {
    try {
      await removeFromCartApi(id);
      await refreshCart();
    } catch (err) {
      console.error('Failed to remove from cart:', err);
    }
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, loading, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}