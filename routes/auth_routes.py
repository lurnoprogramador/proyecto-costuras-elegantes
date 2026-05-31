from flask import Blueprint, request, jsonify, session
from services.auth_service import authenticate_user

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    result = authenticate_user(
        data.get("username"),
        data.get("password"),
        data.get("role")
    )

    if not result["ok"]:
        return jsonify(result), 401

    session["user"] = result["user"]
    return jsonify(result)


@auth_bp.route("/me", methods=["GET"])
def me():
    user = session.get("user")
    if not user:
        return jsonify({"ok": False, "message": "No hay sesión activa."}), 401
    return jsonify({"ok": True, "user": user})


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"ok": True, "message": "Sesión cerrada correctamente."})