from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.routes.weather import weather_bp
from app.routes.auth import auth_bp
from app.routes.favorites import favorites_bp
from app.routes.settings import settings_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend integration
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(weather_bp, url_prefix='/api/weather')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(favorites_bp, url_prefix='/api/favorites')
    app.register_blueprint(settings_bp, url_prefix='/api/user/settings')

    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'WeatherSphere Flask Backend'}

    return app
