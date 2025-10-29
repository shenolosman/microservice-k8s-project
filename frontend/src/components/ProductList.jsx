import React from 'react';

export default function ProductList({ products, onBuy, isAdmin = false, onRemove }) {
  return (
    <div>
      {!products || products.length === 0 ? (
        <>
          <h2 className="text-2xl mb-4">Products</h2>
          <p>No products available.</p>
        </>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((p) => (
            <li key={p._id} className="bg-white p-4 rounded shadow">
              <img
                src={`https://picsum.photos/seed/${p._id}/400/300`}
                alt={p.name}
                className="w-full h-40 object-cover mb-3 rounded"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold mb-1">{p.name}</h3>
              {p.description && (
                <p className="text-gray-600 mb-2">{p.description}</p>
              )}
              <p className="text-lg font-bold mb-2">${p.price}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onBuy(p._id)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                  Buy
                </button>
                <button
                  onClick={() => onRemove && onRemove(p._id)}
                  disabled={!isAdmin}
                  className={`px-3 py-2 rounded transition ${isAdmin ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  aria-disabled={!isAdmin}
                  title={isAdmin ? 'Remove product' : 'Only admins can remove products'}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

