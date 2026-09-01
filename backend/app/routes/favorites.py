from flask import Blueprint, request, jsonify
import jwt
from app.config import Config

favorites_bp = Blueprint('favorites', __name__)

mock_favorites = {
    1: [
        {'id': 1, 'user_id': 1, 'city': 'Hyderabad', 'country': 'India', 'latitude': 17.3850, 'longitude': 78.4867},
        {'id': 2, 'user_id': 1, 'city': 'Khammam', 'country': 'India', 'latitude': 17.2473, 'longitude': 80.1514},
        {'id': 3, 'user_id': 1, 'city': 'Vijayawada', 'country': 'India', 'latitude': 16.5062, 'longitude': 80.6480},
        {'id': 4, 'user_id': 1, 'city': 'Mumbai', 'country': 'India', 'latitude': 19.0760, 'longitude': 72.8777},
        {'id': 5, 'user_id': 1, 'city': 'Bengaluru', 'country': 'India', 'latitude': 12.9716, 'longitude': 77.5946}
    ]
}

def get_current_user_id():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            return payload.get('user_id')
        except Exception:
            return None
    return 1 # Fallback to default user for easy demo

@favorites_bp.route('', methods=['GET'])
def list_favorites():
    user_id = get_current_user_id()
    favs = mock_favorites.get(user_id, [])
    return jsonify(favs)

@favorites_bp.route('', methods=['POST'])
def add_favorite():
    user_id = get_current_user_id()
    data = request.get_json() or {}
    city = data.get('city', '').strip()
    lat = data.get('latitude')
    lon = data.get('longitude')
    country = data.get('country', '')

    if not city or lat is None or lon is None:
        return jsonify({'error': 'Missing required fields: city, latitude, longitude'}), 400

    if user_id not in mock_favorites:
        mock_favorites[user_id] = []

    # Check if already exists
    for item in mock_favorites[user_id]:
        if abs(item['latitude'] - float(lat)) < 0.01 and abs(item['longitude'] - float(lon)) < 0.01:
            return jsonify(item), 200

    new_fav = {
        'id': len(mock_favorites[user_id]) + 1,
        'user_id': user_id,
        'city': city,
        'country': country,
        'latitude': float(lat),
        'longitude': float(lon)
    }
    mock_favorites[user_id].append(new_fav)
    return jsonify(new_fav), 201

@favorites_bp.route('/<int:fav_id>', methods=['DELETE'])
def remove_favorite(fav_id):
    user_id = get_current_user_id()
    if user_id in mock_favorites:
        mock_favorites[user_id] = [f for f in mock_favorites[user_id] if f['id'] != fav_id]
    return jsonify({'success': True, 'message': 'Favorite removed'})
