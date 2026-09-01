from flask import Blueprint, request, jsonify
import jwt
from app.config import Config

settings_bp = Blueprint('settings', __name__)

mock_settings = {
    1: {
        'temperature_unit': 'celsius',
        'wind_speed_unit': 'kmh',
        'theme': 'dark',
        'auto_location': True,
        'notifications': True,
        'refresh_interval': 30
    }
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
    return 1

@settings_bp.route('', methods=['GET'])
def get_user_settings():
    user_id = get_current_user_id()
    settings = mock_settings.get(user_id, {
        'temperature_unit': 'celsius',
        'wind_speed_unit': 'kmh',
        'theme': 'dark',
        'auto_location': True,
        'notifications': True,
        'refresh_interval': 30
    })
    return jsonify(settings)

@settings_bp.route('', methods=['PUT'])
def update_user_settings():
    user_id = get_current_user_id()
    data = request.get_json() or {}
    
    if user_id not in mock_settings:
        mock_settings[user_id] = {
            'temperature_unit': 'celsius',
            'wind_speed_unit': 'kmh',
            'theme': 'dark',
            'auto_location': True,
            'notifications': True,
            'refresh_interval': 30
        }

    mock_settings[user_id].update({
        k: v for k, v in data.items() if k in ['temperature_unit', 'wind_speed_unit', 'theme', 'auto_location', 'notifications', 'refresh_interval']
    })
    
    return jsonify({'success': True, 'settings': mock_settings[user_id]})
