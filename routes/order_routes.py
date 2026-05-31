from flask import Blueprint, request, jsonify, current_app
from services.order_service import (
    get_all_orders,
    get_order_by_id,
    create_order,
    update_order,
    cancel_order,
    delete_order,
)

order_bp = Blueprint("order_bp", __name__, url_prefix="/api/pedidos")


@order_bp.route("", methods=["GET"])
def get_pedidos():
    app = current_app
    items = get_all_orders(app.db, app.serialize_doc)
    return jsonify({"ok": True, "items": items})


@order_bp.route("/<pedido_id>", methods=["GET"])
def get_pedido_by_id(pedido_id):
    app = current_app
    result, status = get_order_by_id(app.db, pedido_id, app.serialize_doc)
    return jsonify(result), status


@order_bp.route("", methods=["POST"])
def create_pedido():
    app = current_app
    data = request.get_json(silent=True) or {}
    result, status = create_order(app.db, data)
    return jsonify(result), status


@order_bp.route("/<pedido_id>", methods=["PUT"])
def update_pedido(pedido_id):
    app = current_app
    data = request.get_json(silent=True) or {}
    result, status = update_order(app.db, pedido_id, data)
    return jsonify(result), status


@order_bp.route("/<pedido_id>/cancelar", methods=["POST"])
def cancel_pedido(pedido_id):
    app = current_app
    result, status = cancel_order(app.db, pedido_id)
    return jsonify(result), status


@order_bp.route("/<pedido_id>", methods=["DELETE"])
def delete_pedido(pedido_id):
    app = current_app
    result, status = delete_order(app.db, pedido_id)
    return jsonify(result), status