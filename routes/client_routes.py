from flask import Blueprint, request, jsonify, current_app
from services.client_service import get_all_clients, create_client

client_bp = Blueprint("client_bp", __name__, url_prefix="/api/clientes")


@client_bp.route("", methods=["GET"])
def get_clientes():
    app = current_app
    items = get_all_clients(app.db, app.serialize_doc)
    return jsonify({"ok": True, "items": items})


@client_bp.route("", methods=["POST"])
def create_cliente():
    app = current_app
    data = request.get_json(silent=True) or {}
    result, status = create_client(app.db, data)
    return jsonify(result), status