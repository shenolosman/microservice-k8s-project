export async function fetchProductsRequest() {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function addProductRequest(name, price, token) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name, price }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add product');
  return data;
}

export async function deleteProductRequest(productId, token) {
  const res = await fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (res.status !== 204) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete product');
  }
}

