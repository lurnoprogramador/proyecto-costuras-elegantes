from flask import Blueprint, request, jsonify
from services.auth_service import login_user, seed_default_admin

auth_bp = Blueprint("auth", __name__)

seed_default_admin()

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    result, status = login_user(
        data.get("username", "").strip(),
        data.get("password", "").strip(),
        data.get("role", "").strip()
    )

    return jsonify(result), status