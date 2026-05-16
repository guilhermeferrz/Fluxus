import os
import json
import logging
import redis
from redis.exceptions import ConnectionError, TimeoutError

# 1. Configuração de Logging Corporativo
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("fluxus_etl")

def obter_conexao_redis() -> redis.Redis:
    """Estabelece conexão resiliente com a Feature Store."""
    host = os.getenv("REDIS_HOST")
    port = int(os.getenv("REDIS_PORT", 6379))
    password = os.getenv("REDIS_PASSWORD")

    # Fail-fast: Trava a execução se as credenciais de produção não existirem
    if not host or not password:
        logger.critical("Variáveis de ambiente REDIS_HOST e REDIS_PASSWORD são obrigatórias.")
        raise ValueError("Credenciais de banco ausentes.")

    try:
        # Uso de ConnectionPool melhora a estabilidade em ambientes Cloud
        pool = redis.ConnectionPool(
            host=host,
            port=port,
            password=password,
            decode_responses=True,
            socket_timeout=5,
            retry_on_timeout=True
        )
        r = redis.Redis(connection_pool=pool)
        r.ping()
        logger.info("✅ Conexão estabelecida com a Feature Store (Redis Cloud).")
        return r
    except (ConnectionError, TimeoutError) as e:
        logger.critical(f"❌ Falha de rede ao conectar no Redis: {e}")
        raise

def injetar_dados(r: redis.Redis, caminho_arquivo: str, batch_size: int = 1000):
    """Lê o arquivo de origem e injeta no Redis usando pipelines atômicos."""
    if not os.path.exists(caminho_arquivo):
        logger.error(f"❌ Arquivo origem não encontrado: {caminho_arquivo}")
        return

    logger.info(f"Iniciando leitura da base de dados: {caminho_arquivo}")

    try:
        with open(caminho_arquivo, 'r', encoding='utf-8') as f:
            dados_sacados = json.load(f)

        total_registros = len(dados_sacados)
        logger.info(f"Total de registros mapeados: {total_registros}. Iniciando injeção (Lotes de {batch_size}).")

        # transaction=False aumenta o throughput da injeção massiva
        pipe = r.pipeline(transaction=False) 
        
        for contador, sacado in enumerate(dados_sacados, 1):
            # Higienização de dados: garante que a chave seja sempre apenas os números
            cnpj_limpo = "".join(filter(str.isdigit, sacado.get('cnpj', '')))
            if not cnpj_limpo:
                logger.warning(f"Registro ignorado (CNPJ ausente ou inválido) na linha {contador}")
                continue
                
            chave = f"feature:sacado:{cnpj_limpo}"
            pipe.set(chave, json.dumps(sacado))

            # Dispara o lote para o Redis a cada "batch_size"
            if contador % batch_size == 0:
                pipe.execute()
                logger.info(f"Progresso: {contador}/{total_registros} registros gravados...")

        # Executa o saldo remanescente do pipeline
        if total_registros % batch_size != 0:
            pipe.execute()
            
        logger.info(f"🚀 Carga finalizada com sucesso! {total_registros} CNPJs disponíveis na Feature Store.")

    except json.JSONDecodeError as e:
        logger.error(f"❌ Arquivo JSON com formatação inválida: {e}")
    except Exception as e:
        logger.error(f"❌ Erro inesperado durante o ETL: {e}")

if __name__ == "__main__":
    # Em produção, você pode injetar o caminho do arquivo (ou URL do Azure/GCS) pelo ambiente
    ARQUIVO_CARGA = os.getenv("FLUXUS_DATA_PATH", "base_fluxus_30mb.json")
    
    try:
        logger.info("Iniciando rotina de carga FIDC Fluxus...")
        redis_client = obter_conexao_redis()
        injetar_dados(redis_client, ARQUIVO_CARGA)
    except Exception:
        logger.critical("Processo de ETL abortado devido a falhas críticas.")
        exit(1)