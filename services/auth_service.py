USERS = [
    {
        "id": 1,
        "username": "admin",
        "password": "123456",
        "role": "admin",
        "name": "Administrador"
    },
    {
        "id": 2,
        "username": "empleado",
        "password": "123456",
        "role": "employee",
        "name": "Empleado"
    }
]


def authenticate_user(username, password, role):
    username = (username or "").strip()
    password = (password or "").strip()
    role = (role or "").strip()

    if not username or not password or not role:
        return {
            "ok": False,
            "message": "Debe completar usuario, contraseña y rol."
        }

    user = next(
        (
            u for u in USERS
            if u["username"] == username
            and u["password"] == password
            and u["role"] == role
        ),
        None
    )

    if not user:
        return {
            "ok": False,
            "message": "Credenciales inválidas."
        }

    safe_user = {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "name": user["name"]
    }

    return {
        "ok": True,
        "user": safe_user
    }