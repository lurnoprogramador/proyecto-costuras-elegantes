from datetime import datetime
from bson import ObjectId


def get_all_orders(db, serialize_doc):
    items = list(db.pedidos.find().sort("_id", -1))
    return [serialize_doc(item) for item in items]


def get_order_by_id(db, order_id, serialize_doc):
    try:
        oid = ObjectId(order_id)
    except Exception:
        return {
            "ok": False,
            "message": "ID de pedido inválido."
        }, 400

    pedido = db.pedidos.find_one({"_id": oid})
    if not pedido:
        return {
            "ok": False,
            "message": "Pedido no encontrado."
        }, 404

    return {
        "ok": True,
        "item": serialize_doc(pedido)
    }, 200


def create_order(db, data):
    clienteid = (data.get("clienteid") or "").strip()
    tipoprenda = (data.get("tipoprenda") or "").strip()
    fechaentrega = (data.get("fechaentrega") or "").strip()
    estado = (data.get("estado") or "pendiente").strip()
    codigo = (data.get("codigo") or "").strip()

    cantidad = int(float(data.get("cantidad") or 1))
    precio = float(data.get("precio") or 0)
    anticipo = float(data.get("anticipo") or 0)
    saldopendiente = max(precio - anticipo, 0)

    if not clienteid or not tipoprenda or not fechaentrega:
        return {
            "ok": False,
            "message": "Cliente, prenda y fecha de entrega son obligatorios."
        }, 400

    payload = {
        "codigo": codigo,
        "clienteid": clienteid,
        "fechaentrega": fechaentrega,
        "estado": estado,
        "tipoprenda": tipoprenda,
        "cantidad": cantidad,
        "talla": (data.get("talla") or "").strip(),
        "tela": (data.get("tela") or "").strip(),
        "color": (data.get("color") or "").strip(),
        "precio": precio,
        "anticipo": anticipo,
        "saldopendiente": saldopendiente,
        "observaciones": (data.get("observaciones") or "").strip(),
        "created_at": datetime.utcnow()
    }

    result = db.pedidos.insert_one(payload)

    return {
        "ok": True,
        "message": "Pedido guardado correctamente.",
        "id": str(result.inserted_id)
    }, 201


def update_order(db, order_id, data):
    try:
        oid = ObjectId(order_id)
    except Exception:
        return {
            "ok": False,
            "message": "ID de pedido inválido."
        }, 400

    pedido = db.pedidos.find_one({"_id": oid})
    if not pedido:
        return {
            "ok": False,
            "message": "Pedido no encontrado."
        }, 404

    if data.get("sumar_abono"):
        abono_adicional = float(data.get("anticipo") or 0)
        nuevo_anticipo = float(pedido.get("anticipo", 0)) + abono_adicional
        precio = float(pedido.get("precio", 0))
        saldopendiente = max(precio - nuevo_anticipo, 0)

        db.pedidos.update_one(
            {"_id": oid},
            {
                "$set": {
                    "anticipo": nuevo_anticipo,
                    "saldopendiente": saldopendiente,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        return {
            "ok": True,
            "message": "Abono actualizado correctamente."
        }, 200

    precio = float(data.get("precio") or pedido.get("precio") or 0)
    anticipo = float(data.get("anticipo") or pedido.get("anticipo") or 0)
    saldopendiente = max(precio - anticipo, 0)

    update_data = {
        "codigo": (data.get("codigo") or pedido.get("codigo") or "").strip(),
        "clienteid": (data.get("clienteid") or pedido.get("clienteid") or "").strip(),
        "fechaentrega": (data.get("fechaentrega") or pedido.get("fechaentrega") or "").strip(),
        "estado": (data.get("estado") or pedido.get("estado") or "pendiente").strip(),
        "tipoprenda": (data.get("tipoprenda") or pedido.get("tipoprenda") or "").strip(),
        "cantidad": int(float(data.get("cantidad") or pedido.get("cantidad") or 1)),
        "talla": (data.get("talla") or pedido.get("talla") or "").strip(),
        "tela": (data.get("tela") or pedido.get("tela") or "").strip(),
        "color": (data.get("color") or pedido.get("color") or "").strip(),
        "precio": precio,
        "anticipo": anticipo,
        "saldopendiente": saldopendiente,
        "observaciones": (data.get("observaciones") or pedido.get("observaciones") or "").strip(),
        "updated_at": datetime.utcnow()
    }

    db.pedidos.update_one({"_id": oid}, {"$set": update_data})

    return {
        "ok": True,
        "message": "Pedido actualizado correctamente."
    }, 200


def cancel_order(db, order_id):
    try:
        oid = ObjectId(order_id)
    except Exception:
        return {
            "ok": False,
            "message": "ID de pedido inválido."
        }, 400

    pedido = db.pedidos.find_one({"_id": oid})
    if not pedido:
        return {
            "ok": False,
            "message": "Pedido no encontrado."
        }, 404

    db.pedidos.update_one(
        {"_id": oid},
        {
            "$set": {
                "estado": "cancelado",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {
        "ok": True,
        "message": "Pedido cancelado correctamente."
    }, 200


def delete_order(db, order_id):
    try:
        oid = ObjectId(order_id)
    except Exception:
        return {
            "ok": False,
            "message": "ID de pedido inválido."
        }, 400

    pedido = db.pedidos.find_one({"_id": oid})
    if not pedido:
        return {
            "ok": False,
            "message": "Pedido no encontrado."
        }, 404

    result = db.pedidos.delete_one({"_id": oid})

    if result.deleted_count == 0:
        return {
            "ok": False,
            "message": "No se pudo eliminar el pedido."
        }, 400

    return {
        "ok": True,
        "message": "Pedido eliminado correctamente."
    }, 200