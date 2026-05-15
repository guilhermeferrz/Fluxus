import os
import redis
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API FIDC Fluxus", description="Motor de Reprecificação")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

try:
    r = redis.Redis(
        host=REDIS_HOST,
        port=int(REDIS_PORT),
        password=REDIS_PASSWORD,
        decode_responses=True
    )
    r.ping()
    print("✅ Conectado ao Redis com sucesso!")
except Exception as e:
    print(f"❌ Erro na conexão com Redis: {e}")
    r = None


@app.get("/sacado/{cnpj:path}", summary="Consulta de Sacado")
def obter_risco_sacado(cnpj: str):
    if r is None:
        raise HTTPException(
            status_code=500,
            detail="Redis não conectado. Verifique as variáveis de ambiente no Render."
        )

    cnpj_limpo = "".join(filter(str.isdigit, cnpj))

    if len(cnpj_limpo) != 14:
        raise HTTPException(
            status_code=400,
            detail="Formato de CNPJ inválido"
        )

    cnpj_formatado = (
        f"{cnpj_limpo[:2]}."
        f"{cnpj_limpo[2:5]}."
        f"{cnpj_limpo[5:8]}/"
        f"{cnpj_limpo[8:12]}-"
        f"{cnpj_limpo[12:]}"
    )

    chaves_possiveis = [
        f"feature:sacado:{cnpj_limpo}",
        f"feature:sacado:{cnpj_formatado}",
        cnpj_limpo,
        cnpj_formatado,
        cnpj,
        f"feature:sacado:{cnpj}",
    ]

    for chave in chaves_possiveis:
        dados = r.get(chave)

        if dados:
            try:
                return json.loads(dados)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=500,
                    detail=f"Dados encontrados na chave {chave}, mas não estão em JSON válido."
                )

    raise HTTPException(
        status_code=404,
        detail={
            "erro": "CNPJ não encontrado na Feature Store",
            "cnpj_recebido": cnpj,
            "cnpj_limpo": cnpj_limpo,
            "cnpj_formatado": cnpj_formatado,
            "chaves_testadas": chaves_possiveis
        }
    )


@app.get("/", include_in_schema=False)
def root():
    return {"status": "online", "projeto": "FIDC Fluxus"}
