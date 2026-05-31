from werkzeug.security import generate_password_hash, check_password_hash
from db.mongo import usuarios_col

def seed_default_admin():
    existing = usuarios_col.find_one({"username": "admin"})
    if existing:
        return

    usuarios_col.insert_one({
        "username": "admin",
        "password": generate_password_hash("Admin12345"),
        "role": "admin",
        "nombre": "Administrador Principal"
    })

def login_user(username, password, role):
    user = usuarios_col.find_one({
        "username": username,
        "role": role
    })

    if not user:
        return {"ok": False, "message": "Usuario no encontrado"}, 404

    if not check_password_hash(user["password"], password):
        return {"ok": False, "message": "Contraseña incorrecta"}, 401

    return {
        "ok": True,
        "message": "Login correcto",
        "user": {
            "username": user["username"],
            "role": user["role"],
            "nombre": user.get("nombre", user["username"])
        }
    }, 200