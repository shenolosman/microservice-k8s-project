import React from 'react';

export default function OrderHistory({ orders, onDelete }) {
  const total = (orders || []).reduce((sum, o) => {
    const price = o && o.product && typeof o.product.price === 'number' ? o.product.price : 0;
    return sum + price;
  }, 0);
  return (
    <div>
      <h2 className="text-2xl mb-4">My Orders</h2>
      {!orders || orders.length === 0 ? (
        <p>You have not placed any orders yet.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order._id} className="bg-white p-4 rounded shadow">
                <p className="font-semibold">
                  Product: {(order.product && order.product.name) || order.product_id}
                </p>
                {order.product && order.product.price !== undefined && (
                  <p className="text-gray-600">Price: ${order.product.price}</p>
                )}
                {order.timestamp && (
                  <p className="text-gray-600">
                    Date: {new Date(order.timestamp).toLocaleString()}
                  </p>
                )}
                <div className="mt-2">
                  <button
                    onClick={() => onDelete(order._id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 p-4 bg-white rounded shadow flex justify-between">
            <span className="font-semibold">Total ({orders.length} orders)</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
        </>
      )}
    </div>
  );
}

