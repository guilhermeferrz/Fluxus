import os
import redis
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# 1. Inicializa a API
app = FastAPI(title="API FIDC Fluxus", description="Motor de Reprecificação")

# Configuração de CORS - permite que o seu site no Vercel fale com esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Conexão com o Redis (Usando Variáveis de Ambiente do Render)
# O os.getenv busca os valores que você cadastrou no "Secrets/Environment" do Render
REDIS_HOST = os.getenv('REDIS_HOST')
REDIS_PORT = os.getenv('REDIS_PORT', '6379') # Valor padrão se não houver no ambiente
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD')

# Inicializa a conexão
try:
    r = redis.Redis(
        host=REDIS_HOST, 
        port=int(REDIS_PORT), 
        password=REDIS_PASSWORD, 
        decode_responses=True
    )
    # Testa a conexão
    r.ping()
    print("✅ Conectado ao Redis com sucesso!")
except Exception as e:
    print(f"❌ Erro na conexão: {e}")

# 3. Endpoint de Consulta
app.get("/sacado/{cnpj:path}", summary="Consulta de Sacado")
def obter_risco_sacado(cnpj: str):
    # 1. Limpa qualquer sujeira que vier do front-end
    cnpj_limpo = "".join(filter(str.isdigit, cnpj))
    
    # 2. Garante que tem 14 números para não quebrar a formatação
    if len(cnpj_limpo) != 14:
        raise HTTPException(status_code=400, detail="Formato de CNPJ inválido")
        
    # 3. Recria a máscara perfeita igualzinha à que está no Redis
    cnpj_banco = f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]}"
    chave = f"feature:sacado:{cnpj_banco}"
    
    dados = r.get(chave)
    if dados:
        return json.loads(dados)
    
    raise HTTPException(status_code=404, detail="CNPJ não encontrado na Feature Store")

# 4. Rota de saúde (Útil para o Render saber que a API está viva)
@app.get("/", include_in_schema=False)
def root():
    return {"status": "online", "projeto": "FIDC Fluxus"}
