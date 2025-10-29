import os
import json
import datetime
import requests
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
import jwt
import redis

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET', 'secret')

# MongoDB connection
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://mongo:27017')
client = MongoClient(mongo_uri)
db = client['order_db']
orders_collection = db['orders']

# Optional Redis cache
redis_host = os.environ.get('REDIS_HOST')
if redis_host:
    r = redis.Redis(host=redis_host, port=6379, decode_responses=True)
else:
    r = None

# Product service base URL (e.g. http://product-service:5001)
product_service_url = os.environ.get('PRODUCT_SERVICE_URL', 'http://product-service:5001')


def verify_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload.get('user_id')
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


@app.route('/orders', methods=['POST'])
def create_order():
    # Validate authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Missing token'}), 401
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Parse request data
    data = request.get_json(force=True)
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'error': 'Missing product_id'}), 400

    # Fetch product details from product service
    try:
        resp = requests.get(f'{product_service_url}/products/{product_id}', timeout=5)
    except Exception:
        return jsonify({'error': 'Failed to connect to product service'}), 502
    if resp.status_code != 200:
        return jsonify({'error': 'Product not found'}), resp.status_code
    product = resp.json()

    # Build order document with embedded product info
    order_doc = {
        'user_id': str(user_id),
        'product_id': product_id,
        'product': {
            'name': product.get('name'),
            'price': product.get('price')
        },
        'timestamp': datetime.datetime.utcnow()
    }
    inserted = orders_collection.insert_one(order_doc)
    order_doc['_id'] = str(inserted.inserted_id)

    # Invalidate cached orders for this user
    if r:
        try:
            r.delete(f'orders:{user_id}')
        except Exception:
            pass

    return jsonify(order_doc), 201


@app.route('/orders', methods=['GET'])
def list_orders():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Missing token'}), 401
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401

    # Check cache
    cache_key = f'orders:{user_id}'
    if r:
        cached = r.get(cache_key)
        if cached:
            try:
                orders = json.loads(cached)
                return jsonify(orders), 200
            except Exception:
                r.delete(cache_key)

    # Fetch from database
    orders = []
    for order in orders_collection.find({'user_id': str(user_id)}):
        order['_id'] = str(order['_id'])
        orders.append(order)
    # Cache result for 30 seconds
    if r:
        try:
            r.setex(cache_key, 30, json.dumps(orders))
        except Exception:
            pass
    return jsonify(orders), 200


@app.route('/orders/<order_id>', methods=['DELETE'])
def delete_order(order_id: str):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Missing token'}), 401
    token = auth_header.replace('Bearer ', '')
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid or expired token'}), 401

    try:
        obj_id = ObjectId(order_id)
    except Exception:
        return jsonify({'error': 'Invalid order id'}), 400

    result = orders_collection.delete_one({'_id': obj_id, 'user_id': str(user_id)})
    if result.deleted_count == 0:
        return jsonify({'error': 'Order not found'}), 404

    if r:
        try:
            r.delete(f'orders:{user_id}')
        except Exception:
            pass
    return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)