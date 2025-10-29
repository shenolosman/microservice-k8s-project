import React, { useEffect, useState } from 'react';
import OrderHistory from '../components/OrderHistory.jsx';
import { fetchOrdersRequest, deleteOrderRequest } from '../api/orders.js';

export default function OrdersPage({ token }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchOrdersRequest(token);
        setOrders(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();
  }, [token]);
  const onDelete = async (orderId) => {
    try {
      await deleteOrderRequest(token, orderId);
      const data = await fetchOrdersRequest(token);
      setOrders(data);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };
  return (
    <div>
      <OrderHistory orders={orders} onDelete={onDelete} />
    </div>
  );
}

