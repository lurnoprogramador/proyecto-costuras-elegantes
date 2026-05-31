from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from datetime import datetime
from bson import ObjectId
from pymongo import MongoClient
import os
import time

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "costuras-elegantes-secret-key")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "costuras_elegantes")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

clientes_col = db["clientes"]
medidas_col = db["medidas"]
pedidos_col = db["pedidos"]
usuarios_col = db["usuarios"]


def serialize_doc(doc):
    if not doc:
        return None

    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("user"):
            return jsonify({
                "ok": False,
                "message": "Sesión no válida."
            }), 401
        return fn(*args, **kwargs)
    return wrapper


def seed_default_user():
    existing = usuarios_col.find_one({"username": "admin"})
    if existing:
        return

    usuarios_col.insert_one({
        "username": "admin",
        "password": "12345",
        "role": "admin",
        "name": "Administrador",
        "created_at": datetime.utcnow()
    })


seed_default_user()


@app.route("/")
def home():
    return render_template("index_login.html")


@app.route("/panel")
def panel():
    if not session.get("user"):
        return redirect(url_for("home"))
    return render_template("index_panel.html")


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()
    role = (data.get("role") or "").strip()

    if not username or not password or not role:
        return jsonify({
            "ok": False,
            "message": "Debe completar usuario, contraseña y rol."
        }), 400

    user = usuarios_col.find_one({
        "username": username,
        "password": password,
        "role": role
    })

    if not user:
        return jsonify({
            "ok": False,
            "message": "Credenciales inválidas."
        }), 401

    session["user"] = {
        "id": str(user["_id"]),
        "username": user["username"],
        "role": user["role"],
        "name": user.get("name", "Usuario")
    }

    return jsonify({
        "ok": True,
        "message": "Inicio de sesión correcto",
        "user": session["user"]
    })


@app.route("/api/auth/logout", methods=["POST"])
@login_required
def logout():
    session.pop("user", None)
    return jsonify({
        "ok": True,
        "message": "Sesión cerrada correctamente"
    })


@app.route("/api/clientes", methods=["GET"])
@login_required
def get_clientes():
    items = [serialize_doc(doc) for doc in clientes_col.find().sort("_id", -1)]
    return jsonify({
        "ok": True,
        "items": items
    })


@app.route("/api/clientes", methods=["POST"])
@login_required
def create_cliente():
    data = request.get_json(silent=True) or request.form.to_dict() or {}

    codigo = (data.get("codigo") or "").strip()
    if not codigo:
        codigo = f"CLI-{str(int(time.time() * 1000))[-6:]}"

    required = ["nombre", "apellido", "documento", "telefono", "email"]
    missing = [field for field in required if not (data.get(field) or "").strip()]

    if missing:
        return jsonify({
            "ok": False,
            "message": f"Faltan campos: {', '.join(missing)}"
        }), 400

    documento = (data.get("documento") or "").strip()

    exists_documento = clientes_col.find_one({"documento": documento})
    if exists_documento:
        return jsonify({
            "ok": False,
            "message": "Ya existe un cliente con ese documento."
        }), 400

    exists_codigo = clientes_col.find_one({"codigo": codigo})
    if exists_codigo:
        codigo = f"CLI-{str(int(time.time() * 1000))[-5:]}{str(len(documento))}"

    payload = {
        "codigo": codigo,
        "genero": data.get("genero", ""),
        "nombre": (data.get("nombre") or "").strip(),
        "apellido": (data.get("apellido") or "").strip(),
        "documento": documento,
        "telefono": (data.get("telefono") or "").strip(),
        "email": (data.get("email") or "").strip(),
        "direccion": (data.get("direccion") or "").strip(),
        "observaciones": (data.get("observaciones") or "").strip(),
        "created_at": datetime.utcnow()
    }

    result = clientes_col.insert_one(payload)
    saved = clientes_col.find_one({"_id": result.inserted_id})

    return jsonify({
        "ok": True,
        "message": "Cliente creado correctamente",
        "item": serialize_doc(saved)
    }), 201


@app.route("/api/medidas", methods=["GET"])
@login_required
def get_medidas():
    items = [serialize_doc(doc) for doc in medidas_col.find().sort("_id", -1)]
    return jsonify({
        "ok": True,
        "items": items
    })


@app.route("/api/medidas", methods=["POST"])
@login_required
def create_medidas():
    data = request.get_json(silent=True) or request.form.to_dict() or {}

    if not data.get("clienteid"):
        return jsonify({
            "ok": False,
            "message": "Debe seleccionar un cliente."
        }), 400

    payload = {
        "clienteid": data.get("clienteid"),
        "cuello": data.get("cuello", ""),
        "hombro": data.get("hombro", ""),
        "pecho": data.get("pecho", ""),
        "cintura": data.get("cintura", ""),
        "cadera": data.get("cadera", ""),
        "tiro": data.get("tiro", ""),
        "largopantalon": data.get("largopantalon", ""),
        "entrepierna": data.get("entrepierna", ""),
        "largototal": data.get("largototal", ""),
        "largomanga": data.get("largomanga", ""),
        "anchomanga": data.get("anchomanga", ""),
        "contornobrazo": data.get("contornobrazo", ""),
        "muneca": data.get("muneca", ""),
        "observaciones": data.get("observaciones", ""),
        "created_at": datetime.utcnow()
    }

    result = medidas_col.insert_one(payload)
    saved = medidas_col.find_one({"_id": result.inserted_id})

    return jsonify({
        "ok": True,
        "message": "Medidas guardadas correctamente",
        "item": serialize_doc(saved)
    }), 201


@app.route("/api/pedidos", methods=["GET"])
@login_required
def get_pedidos():
    pedidos = [serialize_doc(doc) for doc in pedidos_col.find().sort("_id", -1)]
    return jsonify({
        "ok": True,
        "items": pedidos
    })


@app.route("/api/pedidos/<pedido_id>", methods=["GET"])
@login_required
def get_pedido_by_id(pedido_id):
    try:
        oid = ObjectId(pedido_id)
    except Exception:
        return jsonify({
            "ok": False,
            "message": "ID de pedido inválido."
        }), 400

    pedido = pedidos_col.find_one({"_id": oid})

    if not pedido:
        return jsonify({
            "ok": False,
            "message": "Pedido no encontrado."
        }), 404

    return jsonify({
        "ok": True,
        "item": serialize_doc(pedido)
    })


@app.route("/api/pedidos", methods=["POST"])
@login_required
def create_pedido():
    data = request.get_json(silent=True) or request.form.to_dict() or {}

    required = ["codigo", "clienteid", "tipoprenda", "cantidad", "precio", "estado"]
    missing = [field for field in required if not data.get(field)]

    if missing:
        return jsonify({
            "ok": False,
            "message": f"Faltan campos: {', '.join(missing)}"
        }), 400

    try:
        precio = float(data.get("precio", 0) or 0)
        anticipo = float(data.get("anticipo", 0) or 0)
        cantidad = int(data.get("cantidad", 1) or 1)
    except Exception:
        return jsonify({
            "ok": False,
            "message": "Precio, anticipo o cantidad inválidos."
        }), 400

    if precio < 0 or anticipo < 0 or cantidad < 1:
        return jsonify({
            "ok": False,
            "message": "Precio, anticipo o cantidad inválidos."
        }), 400

    if anticipo > precio:
        return jsonify({
            "ok": False,
            "message": "El anticipo no puede superar el precio total."
        }), 400

    saldo = max(precio - anticipo, 0)

    payload = {
        "codigo": data.get("codigo"),
        "clienteid": data.get("clienteid"),
        "tipoprenda": data.get("tipoprenda"),
        "cantidad": cantidad,
        "estado": data.get("estado"),
        "fechaentrega": data.get("fechaentrega", ""),
        "tela": data.get("tela", ""),
        "color": data.get("color", ""),
        "talla": data.get("talla", ""),
        "precio": precio,
        "anticipo": anticipo,
        "saldopendiente": saldo,
        "observaciones": data.get("observaciones", ""),
        "created_at": datetime.utcnow()
    }

    result = pedidos_col.insert_one(payload)
    saved = pedidos_col.find_one({"_id": result.inserted_id})

    return jsonify({
        "ok": True,
        "message": "Pedido guardado correctamente",
        "item": serialize_doc(saved)
    }), 201


@app.route("/api/pedidos/<pedido_id>", methods=["PUT"])
@login_required
def update_pedido(pedido_id):
    try:
        oid = ObjectId(pedido_id)
    except Exception:
        return jsonify({
            "ok": False,
            "message": "ID de pedido inválido."
        }), 400

    pedido_actual = pedidos_col.find_one({"_id": oid})
    if not pedido_actual:
        return jsonify({
            "ok": False,
            "message": "Pedido no encontrado."
        }), 404

    data = request.get_json(silent=True) or request.form.to_dict() or {}

    sumar_abono_raw = data.get("sumar_abono", False)
    modo_abono = str(sumar_abono_raw).lower() in ["true", "1", "yes", "si", "sí"]

    update_data = {}

    campos_texto = [
        "codigo",
        "clienteid",
        "tipoprenda",
        "estado",
        "talla",
        "tela",
        "color",
        "observaciones",
        "fechaentrega"
    ]

    for key in campos_texto:
        if key in data and data.get(key) is not None:
            update_data[key] = data.get(key)

    if "cantidad" in data:
        try:
            cantidad = int(data.get("cantidad") or 1)
            if cantidad < 1:
                raise ValueError()
            update_data["cantidad"] = cantidad
        except Exception:
            return jsonify({
                "ok": False,
                "message": "Cantidad inválida."
            }), 400

    if "precio" in data:
        try:
            precio_recibido = float(data.get("precio") or 0)
            if precio_recibido < 0:
                raise ValueError()
            update_data["precio"] = precio_recibido
        except Exception:
            return jsonify({
                "ok": False,
                "message": "Precio inválido."
            }), 400

    if "anticipo" in data:
        try:
            anticipo_recibido = float(data.get("anticipo") or 0)
            if anticipo_recibido < 0:
                raise ValueError()
        except Exception:
            return jsonify({
                "ok": False,
                "message": "Anticipo inválido."
            }), 400

        anticipo_actual = float(pedido_actual.get("anticipo", 0) or 0)

        if modo_abono:
            update_data["anticipo"] = anticipo_actual + anticipo_recibido
        else:
            update_data["anticipo"] = anticipo_recibido

    if not update_data:
        return jsonify({
            "ok": False,
            "message": "No se enviaron datos para actualizar."
        }), 400

    precio_final = float(update_data.get("precio", pedido_actual.get("precio", 0)) or 0)
    anticipo_final = float(update_data.get("anticipo", pedido_actual.get("anticipo", 0)) or 0)

    if anticipo_final > precio_final:
        return jsonify({
            "ok": False,
            "message": "El anticipo no puede superar el precio total."
        }), 400

    update_data["saldopendiente"] = max(precio_final - anticipo_final, 0)
    update_data["updated_at"] = datetime.utcnow()

    result = pedidos_col.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        return jsonify({
            "ok": False,
            "message": "Pedido no encontrado para actualizar."
        }), 404

    saved = pedidos_col.find_one({"_id": oid})

    return jsonify({
        "ok": True,
        "message": "Pedido actualizado correctamente",
        "item": serialize_doc(saved)
    })


@app.route("/api/pedidos/<pedido_id>/cancelar", methods=["POST"])
@login_required
def cancel_pedido(pedido_id):
    try:
        oid = ObjectId(pedido_id)
    except Exception:
        return jsonify({
            "ok": False,
            "message": "ID de pedido inválido."
        }), 400

    pedido = pedidos_col.find_one({"_id": oid})
    if not pedido:
        return jsonify({
            "ok": False,
            "message": "Pedido no encontrado."
        }), 404

    pedidos_col.update_one(
        {"_id": oid},
        {"$set": {"estado": "cancelado", "updated_at": datetime.utcnow()}}
    )

    saved = pedidos_col.find_one({"_id": oid})

    return jsonify({
        "ok": True,
        "message": "Pedido cancelado correctamente",
        "item": serialize_doc(saved)
    })
    
@app.route("/api/pedidos/<pedido_id>", methods=["DELETE"])
@login_required
def delete_pedido(pedido_id):
    try:
        oid = ObjectId(pedido_id)
    except Exception:
        return jsonify({
            "ok": False,
            "message": "ID de pedido inválido."
        }), 400

    pedido = pedidos_col.find_one({"_id": oid})

    if not pedido:
        return jsonify({
            "ok": False,
            "message": "Pedido no encontrado."
        }), 404

    result = pedidos_col.delete_one({"_id": oid})

    if result.deleted_count == 0:
        return jsonify({
            "ok": False,
            "message": "No se pudo eliminar el pedido."
        }), 400

    return jsonify({
        "ok": True,
        "message": "Pedido eliminado correctamente"
    })


if __name__ == "__main__":
    app.run(debug=True)