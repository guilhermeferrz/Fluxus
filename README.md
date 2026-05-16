# FIDC Fluxus — Motor de Reprecificação Dinâmica em Tempo Real

> **FIAP Challenge • Data Science & Engenharia de Dados**
> *Build 2026.05 · v1.0.0*
>
> "Não é uma POC analítica. É infraestrutura de decisão — três peças, três responsabilidades, zero gambiarra no caminho quente do crédito."

---

## 📑 Visão Geral

O **FIDC Fluxus** é um ecossistema de software e dados projetado para substituir o modelo legado de análise de crédito em lote (*batch* noturno) por uma **Engine de Reprecificação Dinâmica em Tempo Real**. 

O sistema analisa o comportamento de pagadores, avalia a concentração de risco e calcula o deságio ideal de recebíveis (boletos) no exato instante da operação (em milissegundos), protegendo o *yield* do fundo contra volatilidades e defasagens de informação.

---

## 📈 Métricas de Performance em Produção

* **Registros Ativos sob Monitoramento:** `70.320` recebíveis indexados.
* **Latência P99 (Feature Store):** `< 1 ms` (Consultas diretas em memória RAM).
* **Decisão Ponta a Ponta (E2E):** `84 ms` (Tempo total entre o *Request* do Frontend e o *Response* da API com o deságio calculado).
* **Uptime (Últimos 30 dias):** `99,7%`.

---

## 🛠️ Arquitetura do Ecossistema

A solução adota uma topologia cloud-native, desacoplada e orientada a microsserviços de alta disponibilidade:

1.  **Frontend (Cockpit Operacional):** Desenvolvido em **React** e hospedado na **Vercel**. Fornece uma interface reativa, limpa e de alta fidelidade para analistas de crédito visualizarem os scores, as justificativas das decisões e as taxas sugeridas.
2.  **Backend (Engine de Regras):** Construído em **FastAPI (Python)** e hospedado no **Render**. Uma API assíncrona otimizada para alta concorrência que executa a sanitização dos dados de entrada e processa a matriz de risco.
3.  **Feature Store (Camada Quente):** Implementada no **Redis Cloud**. Uma persistência NoSQL em memória que armazena os perfis preditivos e os vetores de decisão associados a cada CNPJ, eliminando gargalos clássicos de I/O de bancos relacionais.

       [ COCKPIT OPERACIONAL ]
            React / Vercel
                  │
          (HTTPS / JSON)  ~84ms E2E
                  ▼
          [ ENGINE DE REGRAS ]
           FastAPI / Render
                  │
        (Chave-Valor)  <1ms P99
                  ▼
         [ FEATURE STORE ]
            Redis Cloud

#O Motor de Reprecificação

O cálculo do deságio sugerido ($d$) é governado por uma função linear baseada em múltiplos KPIs preditivos, cujos pesos foram calibrados para equilibrar segurança institucional e competitividade comercial:$$d = \alpha \cdot \text{perf} + \beta \cdot \text{conc} + \gamma \cdot \text{geo}$$Onde os pesos atribuídos para a versão v1.0.0 são:$\alpha$ (Performance do Pagador / Histórico de Atrasos): 0.52 (Maior peso, priorizando o comportamento histórico).$\beta$ (Concentração de Risco por CNPJ no Fundo): 0.31 (Garante os limites máximos de exposição do fundo).$\gamma$ (Pontuação e Risco Geográfico): 0.17 (Ajuste fino baseado em malha logística e regionalidade).


Resiliência e Sanitização de Dados (Engine)
O motor do backend conta com uma camada de defesa integrada para proteção contra inputs mal formatados ou inconsistentes. No endpoint principal de consulta de sacados, a string recebida é higienizada dinamicamente:

Tratamento de Máscaras (Regex): O sistema aceita CNPJs em qualquer formato (38.864.984/0001-68, 38864984000168 ou variantes com espaços). A API remove pontuações, isola os 14 dígitos numéricos puros e reconstrói a chave uniforme no padrão esperado pela Feature Store (feature:sacado:{cnpj_limpo}).

Validação Estrita (Pydantic): Garante a integridade dos tipos e falha imediatamente (Fail-Fast) com código HTTP 400 Bad Request se a volumetria de caracteres divergir de um documento corporativo válido, protegendo a estabilidade da memória.

#Estrutura do Repositório

├── backend/
│   ├── main.py                # Código principal da API FastAPI (Rotas, CORS e Lógica)
│   ├── requirements.txt       # Dependências do ecossistema Python (FastAPI, Uvicorn, Redis)
│   └── Dockerfile             # Configuração opcional para containerização
├── frontend/                  # Código fonte da aplicação React (Cockpit Vercel)

Ciclo de Retroalimentação Analítica (Captura para BI)

O FIDC Fluxus não descarta os dados após a cotação. Toda requisição processada gera um Data Exhaust (rastro de dados estruturado em log). Esses logs de operação alimentam um pipeline de ETL reverso direcionado ao nosso Data Warehouse corporativo. Esse ciclo permite que analistas e cientistas de dados monitorem o comportamento das aprovações em tempo real e executem futuros backtests para recalibrar as variáveis estratégicas do fundo.
└── scripts/
    └── etl_carga_redis.py     # Script corporativo de carga massiva (+70k registros)

Desenvolvido exclusivamente para o ecossistema FIAP Challenge 2025. Todos os direitos reservados à equipe de engenharia do projeto Fluxus.
    
