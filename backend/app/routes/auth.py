from flask import Blueprint, request, jsonify
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.config import Config

auth_bp = Blueprint('auth', __name__)

# In-memory mock storage if MySQL is offline/unconfigured in local testing
mock_users = {
    'demo@example.com': {
        'id': 1,
        'name': 'Demo User',
        'email': 'demo@example.com',
        'password_hash': generate_password_hash('password123'),
        'created_at': datetime.datetime.now().isoformat()
    }
}

def generate_token(user_id, email, name):
    payload = {
        'user_id': user_id,
        'email': email,
        'name': name,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, Config.JWT_SECRET, algorithm='HS256')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if email in mock_users:
        return jsonify({'error': 'Email already registered'}), 400

    user_id = len(mock_users) + 1
    pwd_hash = generate_password_hash(password)
    mock_users[email] = {
        'id': user_id,
        'name': name,
        'email': email,
        'password_hash': pwd_hash,
        'created_at': datetime.datetime.now().isoformat()
    }

    token = generate_token(user_id, email, name)
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': {'id': user_id, 'name': name, 'email': email}
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = mock_users.get(email)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = generate_token(user['id'], user['email'], user['name'])
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {'id': user['id'], 'name': user['name'], 'email': user['email']}
    })

@auth_bp.route('/profile', methods=['GET'])
def profile():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        return jsonify({'user': payload})
    except Exception:
        return jsonify({'error': 'Invalid or expired token'}), 401
