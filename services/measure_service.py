from datetime import datetime


def get_all_measures(db, serialize_doc):
    items = list(db.medidas.find().sort("_id", -1))
    return [serialize_doc(item) for item in items]


def create_measure(db, data):
    clienteid = (data.get("clienteid") or "").strip()

    if not clienteid:
        return {
            "ok": False,
            "message": "Debe seleccionar un cliente."
        }, 400

    payload = {
        "clienteid": clienteid,
        "cuello": data.get("cuello"),
        "hombro": data.get("hombro"),
        "pecho": data.get("pecho"),
        "cintura": data.get("cintura"),
        "cadera": data.get("cadera"),
        "tiro": data.get("tiro"),
        "largopantalon": data.get("largopantalon"),
        "entrepierna": data.get("entrepierna"),
        "largototal": data.get("largototal"),
        "largomanga": data.get("largomanga"),
        "anchomanga": data.get("anchomanga"),
        "contornobrazo": data.get("contornobrazo"),
        "muneca": data.get("muneca"),
        "observaciones": (data.get("observaciones") or "").strip(),
        "created_at": datetime.utcnow()
    }

    result = db.medidas.insert_one(payload)

    return {
        "ok": True,
        "message": "Medidas guardadas correctamente.",
        "id": str(result.inserted_id)
    }, 201