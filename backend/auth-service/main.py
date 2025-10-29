import os
import datetime
import json
from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
import jwt
import redis

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('JWT_SECRET', 'secret')

# Initialize MongoDB client and select database/collection
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://mongo:27017')
client = MongoClient(mongo_uri)
db = client['auth_db']
users_collection = db['users']

# Initialize Redis client only if REDIS_HOST is provided
redis_host = os.environ.get('REDIS_HOST')
if redis_host:
    r = redis.Redis(host=redis_host, port=6379, decode_responses=True)
else:
    r = None

# Password hashing helper
bcrypt = Bcrypt(app)


def generate_token(user_id: str, role: str) -> str:
    """Generate a JWT token for a given user ID with role claim."""
    payload = {
        'user_id': str(user_id),
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')
    return token if isinstance(token, str) else token.decode('utf-8')


def seed_admin_if_absent() -> None:
    try:
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
        admin_role = os.environ.get('ADMIN_ROLE', 'admin')
        existing = users_collection.find_one({'username': admin_username})
        if not existing:
            hashed = bcrypt.generate_password_hash(admin_password).decode('utf-8')
            users_collection.insert_one({'username': admin_username, 'password': hashed, 'role': admin_role})
        else:
            if existing.get('role') != admin_role:
                users_collection.update_one({'_id': existing['_id']}, {'$set': {'role': admin_role}})
    except Exception:
        # Do not block startup if seeding fails
        pass

# Seed on first run (idempotent)
seed_admin_if_absent()


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json(force=True)
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Missing username or password'}), 400
    # Check if user already exists
    if users_collection.find_one({'username': username}):
        return jsonify({'error': 'User already exists'}), 400
    hashed = bcrypt.generate_password_hash(password).decode('utf-8')
    user_doc = {'username': username, 'password': hashed, 'role': 'user'}
    user_id = users_collection.insert_one(user_doc).inserted_id
    return jsonify({'message': 'User registered successfully', 'user_id': str(user_id)}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True)
    username = data.get('username')
    password = data.get('password')
    user = users_collection.find_one({'username': username})
    if not user or not bcrypt.check_password_hash(user['password'], password):
        return jsonify({'error': 'Invalid credentials'}), 401
    role = user.get('role', 'user')
    token = generate_token(user['_id'], role)
    return jsonify({'token': token, 'role': role}), 200


@app.route('/refresh', methods=['POST'])
def refresh():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Missing token'}), 401
    token = auth_header.replace('Bearer ', '')
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    role = payload.get('role')
    # If role is missing in old tokens, fetch from DB
    if not role:
        try:
            user = users_collection.find_one({'_id': ObjectId(payload['user_id'])})
            role = user.get('role', 'user') if user else 'user'
        except Exception:
            role = 'user'
    new_token = generate_token(payload['user_id'], role)
    return jsonify({'token': new_token, 'role': role}), 200


@app.route('/users', methods=['GET'])
def list_users():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing token'}), 401
    token = auth_header.replace('Bearer ', '')
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

    if payload.get('role') != 'admin':
        return jsonify({'error': 'Forbidden'}), 403

    users = []
    for user in users_collection.find():
        users.append({'id': str(user['_id']), 'username': user['username'], 'role': user.get('role', 'user')})
    return jsonify(users), 200


if __name__ == '__main__':
    # Only for local development; in production use gunicorn or uvicorn
    app.run(host='0.0.0.0', port=5000)