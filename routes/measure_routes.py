from flask import Blueprint, request, jsonify, current_app
from services.measure_service import (
    get_all_measures,
    get_latest_measure_by_client,
    create_measure
)

measure_bp = Blueprint("measure_bp", __name__, url_prefix="/api/medidas")


@measure_bp.route("", methods=["GET"])
def get_medidas():
    app = current_app
    items = get_all_measures(app.db, app.serialize_doc)
    return jsonify({"ok": True, "items": items})


@measure_bp.route("/cliente/<clienteid>", methods=["GET"])
def get_medida_by_cliente(clienteid):
    app = current_app
    result, status = get_latest_measure_by_client(app.db, clienteid, app.serialize_doc)
    return jsonify(result), status


@measure_bp.route("", methods=["POST"])
def create_medida():
    app = current_app
    data = request.get_json(silent=True) or {}
    result, status = create_measure(app.db, data)
    return jsonify(result), status