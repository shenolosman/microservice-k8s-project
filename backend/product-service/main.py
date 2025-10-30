import os
import json
from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
import redis
import jwt
import os


app = Flask(__name__)
SECRET_KEY = os.environ.get('JWT_SECRET', 'secret')

# MongoDB connection
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://mongo:27017')
client = MongoClient(mongo_uri)
db = client['product_db']
products_collection = db['products']

# Optional Redis cache
redis_host = os.environ.get('REDIS_HOST')
if redis_host:
    r = redis.Redis(host=redis_host, port=6379, decode_responses=True)
else:
    r = None


def seed_products_if_empty() -> None:
    try:
        if products_collection.count_documents({}) > 0:
            return
        default_products = [
            {"name": "Wireless Mouse", "price": 19.99},
            {"name": "Mechanical Keyboard", "price": 59.99},
            {"name": "USB-C Hub", "price": 24.99},
            {"name": "27\" Monitor", "price": 189.99},
            {"name": "Laptop Stand", "price": 29.99},
            {"name": "Noise-Canceling Headphones", "price": 129.99},
            {"name": "Webcam 1080p", "price": 39.99},
            {"name": "External SSD 1TB", "price": 99.99},
            {"name": "Portable Charger", "price": 22.99},
            {"name": "Bluetooth Speaker", "price": 34.99},
            {"name": "Desk Lamp", "price": 18.99},
            {"name": "Gaming Chair", "price": 149.99},
            {"name": "Microphone USB", "price": 49.99},
            {"name": "HDMI Cable", "price": 8.99},
            {"name": "Ethernet Switch", "price": 26.99},
            {"name": "Smart Plug", "price": 12.99},
            {"name": "Action Camera", "price": 79.99},
            {"name": "VR Headset", "price": 249.99},
            {"name": "Graphics Tablet", "price": 69.99},
            {"name": "LED Strip Lights", "price": 16.99},
        ]
        products_collection.insert_many(default_products)
        if r:
            try:
                r.delete('products')
            except Exception:
                pass
    except Exception:
        # If seeding fails, continue without blocking service startup
        pass

# Seed on first run when empty (idempotent)
seed_products_if_empty()
@app.route("/")
def index():
    return "Service is running", 200

@app.route('/products', methods=['GET'])
def get_products():
    # Attempt to serve from cache
    if r:
        cached = r.get('products')
        if cached:
            try:
                products = json.loads(cached)
                return jsonify(products), 200
            except Exception:
                # If cache is malformed, delete it and fall back to DB
                r.delete('products')
    # Query database
    products = []
    for product in products_collection.find():
        product['_id'] = str(product['_id'])
        products.append(product)
    # Cache result for 30 seconds
    if r:
        try:
            r.setex('products', 30, json.dumps(products))
        except Exception:
            pass
    return jsonify(products), 200


@app.route('/products/<product_id>', methods=['GET'])
def get_product(product_id: str):
    try:
        obj_id = ObjectId(product_id)
    except Exception:
        return jsonify({'error': 'Invalid product id'}), 400
    product = products_collection.find_one({'_id': obj_id})
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    product['_id'] = str(product['_id'])
    return jsonify(product), 200


@app.route('/products', methods=['POST'])
def add_product():
    # Check admin role
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Missing token'}), 401
    token = auth_header.replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        if payload.get('role') != 'admin':
            return jsonify({'error': 'Forbidden'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    data = request.get_json(force=True)
    name = data.get('name')
    price = data.get('price')
    if not name or price is None:
        return jsonify({'error': 'Missing name or price'}), 400
    try:
        price_val = float(price)
    except ValueError:
        return jsonify({'error': 'Price must be a number'}), 400
    product = {'name': name, 'price': price_val}
    inserted = products_collection.insert_one(product)
    product['_id'] = str(inserted.inserted_id)
    # Invalidate cache
    if r:
        try:
            r.delete('products')
        except Exception:
            pass
    return jsonify(product), 201


@app.route('/products/<product_id>', methods=['DELETE'])
def delete_product(product_id: str):
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Missing token'}), 401
    token = auth_header.replace('Bearer ', '')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        if payload.get('role') != 'admin':
            return jsonify({'error': 'Forbidden'}), 403
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    try:
        obj_id = ObjectId(product_id)
    except Exception:
        return jsonify({'error': 'Invalid product id'}), 400
    result = products_collection.delete_one({'_id': obj_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Product not found'}), 404
    if r:
        try:
            r.delete('products')
        except Exception:
            pass
    return '', 204

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)