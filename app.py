from flask import Flask, render_template, session
from flask_pymongo import PyMongo
from functools import wraps
from config import Config

mongo = PyMongo()


def create_app():
    app = Flask(__name__, template_folder="templates", static_folder="static")
    app.config.from_object(Config)

    mongo.init_app(app)
    app.db = mongo.cx[app.config["DB_NAME"]]

    def serialize_doc(doc):
        if not doc:
            return doc
        doc["_id"] = str(doc["_id"])
        return doc

    def login_required(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if "user" not in session:
                return {"ok": False, "message": "Sesión no válida o expirada."}, 401
            return fn(*args, **kwargs)
        return wrapper

    app.serialize_doc = serialize_doc
    app.login_required = login_required

    @app.route("/")
    def login_page():
        return render_template("index_login.html")

    @app.route("/panel")
    def panel_page():
        if "user" not in session:
            return render_template("index_login.html")
        return render_template("index_panel.html")

    from routes.auth_routes import auth_bp
    from routes.client_routes import client_bp
    from routes.measure_routes import measure_bp
    from routes.order_routes import order_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(measure_bp)
    app.register_blueprint(order_bp)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)