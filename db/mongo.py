from pymongo import MongoClient
from config import Config

client = MongoClient(Config.MONGO_URI)
db = client[Config.DB_NAME]

usuarios_col = db["usuarios"]
clientes_col = db["clientes"]
medidas_col = db["medidas"]
pedidos_col = db["pedidos"]