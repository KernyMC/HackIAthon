#!/usr/bin/env python3
"""
Inserta revisores ficticios en app.revisores y genera cédulas
ecuatorianas válidas para claims.asegurados.

DDL (CREATE TABLE, ALTER TABLE) se ejecuta con el usuario admin.
DML (INSERT, UPDATE) se ejecuta con el mismo usuario admin para simplificar.
"""
import os, sys, random
from urllib.parse import quote_plus
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'api'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# ── Conexión admin (para DDL) ─────────────────────────────────────────
def get_admin_url() -> str:
    host     = os.environ.get("ALLOYDB_HOST", "localhost")
    port     = os.environ.get("ALLOYDB_PORT", "5432")
    database = os.environ.get("ALLOYDB_DATABASE", "fraudia")
    user     = os.environ.get("ALLOYDB_ADMIN_USER", os.environ.get("ALLOYDB_USER", "postgres"))
    password = os.environ.get("ALLOYDB_ADMIN_PASSWORD", os.environ.get("ALLOYDB_PASSWORD", ""))
    return f"postgresql+psycopg://{quote_plus(user)}:{quote_plus(password)}@{host}:{port}/{database}"

engine = create_engine(get_admin_url(), pool_pre_ping=True)
AdminSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Algoritmo cédula ecuatoriana (módulo 10) ──────────────────────────
PROVINCIAS = list(range(1, 25))  # 01-24

def _digito_verificador(nueve: str) -> int:
    coefs = [2,1,2,1,2,1,2,1,2]
    total = 0
    for d, c in zip(nueve, coefs):
        p = int(d) * c
        total += p if p < 10 else p - 9
    rem = total % 10
    return 0 if rem == 0 else 10 - rem

def generar_cedula() -> str:
    provincia = str(random.choice(PROVINCIAS)).zfill(2)
    tercero   = str(random.randint(0, 6))
    resto     = ''.join(str(random.randint(0, 9)) for _ in range(6))
    nueve     = provincia + tercero + resto
    verificador = _digito_verificador(nueve)
    return nueve + str(verificador)


# ── Revisores ficticios ───────────────────────────────────────────────
REVISORES = [
    ('REV-001', 'Ana Morales',      'Automóvil',           'ana.morales@aseguradorsur.ec'),
    ('REV-002', 'Carlos Jiménez',   'Salud',                'carlos.jimenez@aseguradorsur.ec'),
    ('REV-003', 'María Suárez',     'Hogar',                'maria.suarez@aseguradorsur.ec'),
    ('REV-004', 'Diego Paredes',    'Vida',                 'diego.paredes@aseguradorsur.ec'),
    ('REV-005', 'Lucía Vásquez',    'Generales',            'lucia.vasquez@aseguradorsur.ec'),
]

def seed(db):
    # 1. Crear tabla app.revisores si no existe
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS app.revisores (
            id_revisor      TEXT PRIMARY KEY,
            nombre          TEXT NOT NULL,
            especialidad    TEXT NOT NULL,
            email           TEXT NOT NULL,
            casos_activos   INTEGER DEFAULT 0
        )
    """))

    # 2. Agregar columnas a claims.siniestros si no existen
    for col, tipo in [
        ('estado_revision',      "TEXT DEFAULT 'Pendiente'"),
        ('id_revisor_asignado',  'TEXT'),
        ('fecha_asignacion',     'TIMESTAMP'),
    ]:
        db.execute(text(f"ALTER TABLE claims.siniestros ADD COLUMN IF NOT EXISTS {col} {tipo}"))

    # 3. Agregar columna cedula a claims.asegurados si no existe
    db.execute(text("ALTER TABLE claims.asegurados ADD COLUMN IF NOT EXISTS cedula TEXT"))

    db.commit()

    # 4. Insertar revisores
    for rev in REVISORES:
        db.execute(text("""
            INSERT INTO app.revisores (id_revisor, nombre, especialidad, email)
            VALUES (:id, :nombre, :esp, :email)
            ON CONFLICT (id_revisor) DO NOTHING
        """), {'id': rev[0], 'nombre': rev[1], 'esp': rev[2], 'email': rev[3]})

    # 5. Generar cédulas para asegurados que no tienen
    ids = db.execute(text(
        "SELECT id_asegurado FROM claims.asegurados WHERE cedula IS NULL"
    )).fetchall()
    cedulas_usadas = set()
    for (id_aseg,) in ids:
        while True:
            ced = generar_cedula()
            if ced not in cedulas_usadas:
                cedulas_usadas.add(ced)
                break
        db.execute(text(
            "UPDATE claims.asegurados SET cedula = :c WHERE id_asegurado = :id"
        ), {'c': ced, 'id': id_aseg})

    db.commit()
    print(f"✓ {len(REVISORES)} revisores insertados")
    print(f"✓ {len(ids)} cédulas ecuatorianas generadas")

    # 6. Otorgar permisos sobre la nueva tabla al app_user y loader_user
    for role in ['app_user', 'loader_user']:
        db.execute(text(f"GRANT SELECT, INSERT, UPDATE ON app.revisores TO {role}"))
    db.commit()
    print("✓ Permisos otorgados sobre app.revisores")


if __name__ == '__main__':
    db = AdminSession()
    try:
        seed(db)
    finally:
        db.close()
