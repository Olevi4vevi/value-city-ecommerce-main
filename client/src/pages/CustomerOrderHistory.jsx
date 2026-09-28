import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getOrders, getOrderDetail, cancelOrder } from '../api/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import OrderStatusPanel from '../components/OrderStatusPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import { STATUS_LABEL } from '../constants/orderStatus';
import './customerDashboard.css';

const GRADE_LABEL = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
};

const ACTIVE_STATUSES = ['pending', 'paid', 'shipped'];

export default function CustomerOrderHistory() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState('');
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);

  // REQ-18: if the account dashboard sent someone here because they tried to
  // deactivate/delete with orders still pending pickup, show them why and
  // give them a way back once they've dealt with it (or not -- they can
  // still return and proceed regardless, per REQ-18/21).
  const [pendingAction] = useState(location.state?.pendingAction || null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    try {
      const res = await getOrderDetail(orderId);
      setOrderItems(res.data.items);
      setExpandedOrder(orderId);
    } catch (err) {
      console.error('Failed to load order detail:', err);
    }
  };

  // REQ-25: cancel an order that hasn't been picked up yet and request a
  // refund, independent of deactivating/deleting the account.
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setActionError('');
    try {
      await cancelOrder(cancelTarget);
      setOrders((prev) => prev.map((o) => (o.order_id === cancelTarget ? { ...o, status: 'cancelled' } : o)));
      setCancelTarget(null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not cancel this order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  // REQ-29: a downloadable image receipt for any single order, whatever its
  // current status -- for an order still awaiting pickup this doubles as
  // proof of purchase to bring in store (see REQ-18); for a picked-up order
  // it's just a copy of the receipt. Built off-DOM with html2canvas so it
  // doesn't depend on the on-page OrderStatusPanel only rendering a filled
  // receipt for completed orders.
  const handleDownloadReceipt = async (order) => {
    setDownloadingReceiptId(order.order_id);
    setActionError('');
    const container = document.createElement('div');
    try {
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '380px';
      container.style.padding = '28px';
      container.style.background = '#F8F6F0';
      container.style.fontFamily = "'Archivo', sans-serif";
      container.style.color = '#1E2A22';

      const itemsHtml = orderItems.map((item) => `
        <div style="display:flex; justify-content:space-between; gap:10px; padding:7px 0; font-size:12.5px; border-bottom:1px dashed rgba(30,42,34,0.12);">
          <span>${item.item_name} (${item.size}, ${GRADE_LABEL[item.condition_grade] || item.condition_grade}) &times; ${item.quantity}</span>
          <span>$${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
        </div>
      `).join('');

      container.innerHTML = `
        <div style="font:700 15px 'Archivo', sans-serif; letter-spacing:0.08em; text-transform:uppercase; color:#24392E; margin-bottom:4px;">Value City</div>
        <div style="font-size:11px; color:#77877C; margin-bottom:18px;">Suva, Fiji &mdash; order receipt</div>
        <div style="display:flex; justify-content:space-between; font-size:13px; padding:6px 0;">
          <span style="color:#77877C;">Order number</span><span style="font-family:'JetBrains Mono', monospace;">#${order.order_id}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px; padding:6px 0;">
          <span style="color:#77877C;">Order date</span><span>${new Date(order.order_date).toLocaleDateString()}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px; padding:6px 0 14px;">
          <span style="color:#77877C;">Pickup status</span><span style="font-weight:600; color:#34503F;">${STATUS_LABEL[order.status] || order.status}</span>
        </div>
        <div style="border-top:1px solid rgba(30,42,34,0.12); padding-top:10px;">${itemsHtml}</div>
        <div style="display:flex; justify-content:space-between; font-weight:700; font-size:14px; padding-top:14px; margin-top:6px; border-top:1px solid #24392E;">
          <span>Total</span><span>$${Number(order.total_amount).toFixed(2)}</span>
        </div>
        <div style="margin-top:18px; font-size:10.5px; color:#77877C;">Generated ${new Date().toLocaleString()} &mdash; reflects pickup status at time of download.</div>
      `;

      document.body.appendChild(container);
      const canvas = await html2canvas(container, { backgroundColor: '#F8F6F0', scale: 2 });

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `value-city-receipt-order-${order.order_id}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to generate receipt image:', err);
      setActionError('Could not generate the receipt image. Please try again.');
    } finally {
      if (container.parentNode) document.body.removeChild(container);
      setDownloadingReceiptId(null);
    }
  };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const hasRecentOrders = orders.some((o) => new Date(o.order_date) >= sixMonthsAgo);

  const handleDownloadPdf = () => {
    const recentOrders = orders.filter((o) => new Date(o.order_date) >= sixMonthsAgo);

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Value City — Order History', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Last 6 months, generated ${new Date().toLocaleDateString()}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['Order #', 'Date', 'Status', 'Total']],
      body: recentOrders.map((o) => [
        `#${o.order_id}`,
        new Date(o.order_date).toLocaleDateString(),
        STATUS_LABEL[o.status] || o.status,
        `$${Number(o.total_amount).toFixed(2)}`
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [36, 57, 46] }
    });

    const totalSpent = recentOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const finalY = doc.lastAutoTable.finalY || 32;
    doc.setFontSize(10);
    doc.setTextColor(30, 42, 34);
    doc.text(`Total spent (last 6 months): $${totalSpent.toFixed(2)}`, 14, finalY + 10);

    doc.save(`value-city-order-history-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const escapeCsv = (value) => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleDownloadCsv = () => {
    const headers = ['Order ID', 'Date', 'Status', 'Total (FJD)'];
    const rows = orders.map((o) => [
      o.order_id,
      new Date(o.order_date).toLocaleDateString(),
      STATUS_LABEL[o.status] || o.status,
      Number(o.total_amount).toFixed(2)
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `value-city-order-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Order History</h1>
        {orders.length > 0 && (
          <div className="dashboard-header-actions">
            <button className="link-btn" onClick={handleDownloadPdf} disabled={!hasRecentOrders}>
              Download PDF (6mo)
            </button>
            <button className="link-btn" onClick={handleDownloadCsv}>Download CSV</button>
          </div>
        )}
      </header>

      {!hasRecentOrders && orders.length > 0 && (
        <p className="acct-note">No orders in the last 6 months — nothing to include in a PDF yet.</p>
      )}

      {pendingAction && (
        <div className="orderhist-banner">
          <p>
            You have orders that haven't been picked up yet. Download a receipt below for proof of
            purchase to bring in store, or cancel an order to request a refund — either way, you can
            go back and finish {pendingAction === 'delete' ? 'deleting' : 'deactivating'} your account
            whenever you're ready.
          </p>
          <Link
            to="/dashboard"
            state={{ tab: 'danger', acknowledgedPending: true, pendingAction }}
            className="orderhist-banner-link"
          >
            Back to account settings →
          </Link>
        </div>
      )}

      {actionError && <div className="status-error">{actionError}</div>}

      {loading ? (
        <p>Loading your orders…</p>
      ) : orders.length === 0 ? (
        <div className="dashboard-card">
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => {
            const isActive = ACTIVE_STATUSES.includes(order.status);
            return (
              <div key={order.order_id} className="order-card">
                <div className="order-summary" onClick={() => toggleOrder(order.order_id)}>
                  <div>
                    <strong>Order #{order.order_id}</strong>
                    <span className={`status-badge status-${order.status}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                  <div className="order-meta">
                    <span>{new Date(order.order_date).toLocaleDateString()}</span>
                    <span>${Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {expandedOrder === order.order_id && (
                  <div className="order-items">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="order-item-row">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.item_name} className="order-item-thumb" />
                        )}
                        <span className="order-item-name">
                          {item.item_name} ({item.size}, {item.condition_grade})
                        </span>
                        <span>x{item.quantity} — ${Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}

                    <OrderStatusPanel order={order} items={orderItems} />

                    <div className="order-item-actions">
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => handleDownloadReceipt(order)}
                        disabled={downloadingReceiptId === order.order_id}
                      >
                        {downloadingReceiptId === order.order_id ? 'Generating…' : 'Download receipt'}
                      </button>
                      {isActive && (
                        <button
                          type="button"
                          className="link-btn link-btn-danger"
                          onClick={() => setCancelTarget(order.order_id)}
                        >
                          Cancel order & request refund
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel this order?"
        message="This cancels the order and requests a refund. This can't be undone."
        confirmLabel={cancelling ? 'Cancelling…' : 'Yes, cancel order'}
        cancelLabel="Keep order"
        tone="danger"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
