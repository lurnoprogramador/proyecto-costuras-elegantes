from datetime import datetime


def get_all_clients(db, serialize_doc):
    items = list(db.clientes.find().sort("_id", -1))
    return [serialize_doc(item) for item in items]


def create_client(db, data):
    nombre = (data.get("nombre") or "").strip()
    apellido = (data.get("apellido") or "").strip()
    documento = (data.get("documento") or "").strip()
    telefono = (data.get("telefono") or "").strip()
    email = (data.get("email") or "").strip()
    codigo = (data.get("codigo") or "").strip()

    if not nombre or not apellido or not documento or not telefono or not email:
        return {
            "ok": False,
            "message": "Nombre, apellido, documento, teléfono y email son obligatorios."
        }, 400

    exists = db.clientes.find_one({"documento": documento})
    if exists:
        return {
            "ok": False,
            "message": "Ya existe un cliente con ese documento."
        }, 400

    payload = {
        "codigo": codigo,
        "genero": (data.get("genero") or "").strip(),
        "nombre": nombre,
        "apellido": apellido,
        "documento": documento,
        "telefono": telefono,
        "email": email,
        "direccion": (data.get("direccion") or "").strip(),
        "observaciones": (data.get("observaciones") or "").strip(),
        "created_at": datetime.utcnow()
    }

    result = db.clientes.insert_one(payload)

    return {
        "ok": True,
        "message": "Cliente creado correctamente.",
        "id": str(result.inserted_id)
    }, 201