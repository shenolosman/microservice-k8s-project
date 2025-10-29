import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductList from '../components/ProductList.jsx';
import AddProductModal from '../components/AddProductModal.jsx';
import { fetchProductsRequest, addProductRequest, deleteProductRequest } from '../api/products.js';
import { createOrderRequest } from '../api/orders.js';

export default function ProductsPage({ token }) {
  const [products, setProducts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [addError, setAddError] = useState('');
  const navigate = useNavigate();
  const username = typeof window !== 'undefined' ? (localStorage.getItem('username') || '') : '';
  const isAdmin = username === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProductsRequest();
        setProducts(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();
  }, []);

  const onBuy = async (productId) => {
    if (!token) {
      navigate('/auth', { state: { from: '/' } });
      return;
    }
    try {
      await createOrderRequest(token, productId);
      alert('Order placed successfully');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  const onRemove = async (productId) => {
    if (!isAdmin) {
      alert('Only admins can delete products');
      return;
    }
    try {
      await deleteProductRequest(productId, token);
      const data = await fetchProductsRequest();
      setProducts(data);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert(e.message || 'Failed to delete product');
    }
  };

  const onSubmitNew = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only admins can add products');
      return;
    }
    setAddError('');
    if (!name || price === '') {
      setAddError('Name and price are required');
      return;
    }
    const priceNum = Number(price);
    if (Number.isNaN(priceNum)) {
      setAddError('Price must be a number');
      return;
    }
    try {
      await addProductRequest(name, priceNum, token);
      setShowAdd(false);
      setName('');
      setPrice('');
      const data = await fetchProductsRequest();
      setProducts(data);
    } catch (e) {
      setAddError(e.message || 'Failed to add product');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl">Products</h2>
        {token && (
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={() => {
              if (!isAdmin) { alert('Only admins can add products'); return; }
              setShowAdd(true);
            }}
          >
            Add Product
          </button>
        )}
      </div>
      <ProductList products={products} onBuy={onBuy} isAdmin={isAdmin} onRemove={onRemove} />
      <AddProductModal
        show={showAdd}
        onClose={() => setShowAdd(false)}
        name={name}
        price={price}
        setName={setName}
        setPrice={setPrice}
        error={addError}
        onSubmit={onSubmitNew}
      />
    </div>
  );
}

