from flask import Blueprint, request, jsonify
from app.services.weather_service import WeatherService

weather_bp = Blueprint('weather', __name__)

@weather_bp.route('/current', methods=['GET'])
def get_current():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    city = request.args.get('city', type=str)
    
    if lat is None or lon is None:
        if city:
            results = WeatherService.search_cities(city)
            if results and len(results) > 0:
                lat = results[0]['latitude']
                lon = results[0]['longitude']
            else:
                return jsonify({'error': 'City not found'}), 404
        else:
            return jsonify({'error': 'Missing coordinates or city'}), 400

    try:
        data = WeatherService.get_weather_by_coords(lat, lon)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@weather_bp.route('/search', methods=['GET'])
def search_cities():
    q = request.args.get('q', '').strip()
    if not q or len(q) < 2:
        return jsonify([])
    try:
        results = WeatherService.search_cities(q)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@weather_bp.route('/location', methods=['GET'])
def reverse_location():
    lat = request.args.get('lat', type=float)
    lon = request.args.get('lon', type=float)
    if lat is None or lon is None:
        return jsonify({'error': 'Missing lat or lon'}), 400
    try:
        loc = WeatherService.reverse_geocode(lat, lon)
        return jsonify(loc)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
