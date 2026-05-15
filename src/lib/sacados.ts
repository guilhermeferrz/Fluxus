import raw from "@/data/sacados.json";
import type { AnalysisData, RiskLevel } from "@/lib/mockData";

export interface MesHistorico {
  mes: string;
  score_default: number;
  score_fluxo: number;
  media_atraso_dias: number;
  volume_transacionado_brl: number;
  inadimplencia_curta_pct: number;
}

export interface SacadoRaw {
  id_sacado: string;
  cnpj: string;
  razao_social: string;
  segmento: string;
  perfil_analitico: string;
  dados_atuais: {
    score_default: number;
    score_fluxo: number;
    media_atraso_dias_atual: number;
    indice_liquidez_1m: number;
    recomendacao_desagio_percentual: number;
    insight_ia: string;
  };
  historico_12_meses: MesHistorico[];
}

export interface SacadoAnalysis extends AnalysisData {
  segmento: string;
  perfil: string;
  insightIA: string;
  liquidez: number;
  desagio: number;
  historico: MesHistorico[];
  scoreDefaultAtual: number;
  scoreFluxoAtual: number;
}

const SACADOS = raw as SacadoRaw[];

const cleanCnpj = (s: string) => s.replace(/\D/g, "");

const formatCnpjStr = (raw: string) => {
  const d = cleanCnpj(raw).padEnd(14, "0").slice(0, 14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
};

// Heurística: o score_default é "saúde de crédito" (alto = bom).
// O score_fluxo é "risco de fluxo" (alto = ruim). Combinamos os dois.
const classify = (sd: number, sf: number): RiskLevel => {
  const fluxoSaude = 100 - sf; // alto = bom
  const combined = sd * 0.45 + fluxoSaude * 0.55;
  if (combined >= 80) return "excelente";
  if (combined >= 55) return "bom";
  return "mau";
};

const trendOf = (vals: number[], higherIsBetter: boolean): "Alta" | "Estável" | "Baixa" => {
  if (vals.length < 4) return "Estável";
  const first = vals.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const last = vals.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const delta = ((last - first) / Math.max(first, 1)) * 100;
  const dir = higherIsBetter ? delta : -delta;
  if (dir > 8) return "Alta";
  if (dir < -8) return "Baixa";
  return "Estável";
};

const verdictFor = (level: RiskLevel, perfil: string, insight: string) => {
  if (level === "excelente") {
    return {
      title: "Aprovado",
      badge: perfil,
      description: insight,
      probability: 92,
      confidence: 95,
      risk: "Muito Baixo",
    };
  }
  if (level === "bom") {
    return {
      title: "Aprovado com Cautela",
      badge: perfil,
      description: insight,
      probability: 70,
      confidence: 82,
      risk: "Moderado",
    };
  }
  return {
    title: "Reprovado",
    badge: perfil,
    description: insight,
    probability: 28,
    confidence: 89,
    risk: "Muito Alto",
  };
};

const labelPadrao = (sd: number) =>
  sd >= 90 ? "Excelente Pontuação" :
  sd >= 70 ? "Boa Pontuação" :
  sd >= 50 ? "Atenção Necessária" : "Pontuação Crítica";

// Score Fluxo: ALTO = RUIM (risco alto de atraso). Exibimos o risco bruto.
const labelFluxo = (sf: number, atraso: number) => {
  if (sf >= 70 || atraso >= 25) return "Risco Crítico de Atraso";
  if (sf >= 50) return "Risco de Fluxo Elevado";
  if (sf >= 30) return "Fluxo com Volatilidade";
  if (sf >= 15) return "Fluxo Estável";
  return "Fluxo Saudável";
};

const factorsPadrao = (s: SacadoRaw): string[] => {
  const out: string[] = [];
  const sd = s.dados_atuais.score_default;
  if (sd >= 90) out.push("Histórico de crédito impecável");
  else if (sd >= 70) out.push("Histórico de crédito sólido");
  else if (sd >= 50) out.push("Sinais de deterioração no rating");
  else out.push("Rating de crédito crítico");

  out.push(`Liquidez 1m em ${(s.dados_atuais.indice_liquidez_1m * 100).toFixed(0)}%`);
  out.push(`Segmento: ${s.segmento}`);
  return out;
};

const factorsFluxo = (s: SacadoRaw): string[] => {
  const out: string[] = [];
  const atraso = s.dados_atuais.media_atraso_dias_atual;
  const sf = s.dados_atuais.score_fluxo;

  if (sf >= 70 || atraso >= 25) {
    out.push("Histórico de atrasos sistemáticos na Núclea");
    out.push(`Média de atraso superior a ${Math.max(25, Math.floor(atraso))} dias`);
    out.push("Alto risco de corrosão de rentabilidade");
  } else if (sf >= 50 || atraso >= 10) {
    out.push(`Atraso médio de ${atraso.toFixed(1)} dias na Núclea`);
    out.push("Padrão de pagamento volátil nos últimos meses");
    out.push("Custo de capital elevado e quantificável");
  } else if (sf >= 30 || atraso >= 3) {
    out.push(`Atraso médio de ${atraso.toFixed(1)} dias`);
    out.push("Pequenas oscilações no fluxo transacional");
    out.push("Necessidade de monitoramento contínuo");
  } else {
    out.push("Pontualidade transacional exemplar na Núclea");
    out.push("Fluxo de caixa altamente previsível");
    out.push("Baixíssimo risco de inadimplência curta");
  }

  out.push(`Deságio recomendado pela IA: ${s.dados_atuais.recomendacao_desagio_percentual.toFixed(2)}%`);
  return out;
};

// Mapa por CNPJ (limpo). Inclui também sinônimos legados para os 3 CNPJs de teste.
const buildMap = (): Record<string, SacadoAnalysis> => {
  const map: Record<string, SacadoAnalysis> = {};

  SACADOS.forEach((s) => {
    const sd = s.dados_atuais.score_default;
    const sf = s.dados_atuais.score_fluxo;
    const level = classify(sd, sf);
    // Padrão: alto = bom (saúde de crédito).
    const scorePadraoVal = Math.round(sd * 10);
    // Fluxo: alto = RUIM (risco de atraso). Exibimos o risco bruto.
    const scoreFluxoVal = Math.round(sf * 10);

    const trendPadrao = trendOf(s.historico_12_meses.map((h) => h.score_default), true);
    // Fluxo: tendência de Alta no risco = RUIM. Mantemos o risco bruto, sem inverter.
    const trendFluxo = trendOf(s.historico_12_meses.map((h) => h.score_fluxo), false);

    const cnpjClean = cleanCnpj(s.cnpj);
    const cnpjKey = cnpjClean.padEnd(14, "0").slice(0, 14);

    const analysis: SacadoAnalysis = {
      cnpj: cnpjKey,
      cnpjFormatted: formatCnpjStr(cnpjKey),
      companyName: s.razao_social,
      level,
      verdict: verdictFor(level, s.perfil_analitico, s.dados_atuais.insight_ia),
      scorePadrao: {
        value: scorePadraoVal,
        label: labelPadrao(sd),
        probability: sd,
        trend: trendPadrao,
        factors: factorsPadrao(s),
      },
      scoreFluxo: {
        value: scoreFluxoVal,
        label: labelFluxo(sf, s.dados_atuais.media_atraso_dias_atual),
        probability: sf,
        trend: trendFluxo,
        avgDelay: `${s.dados_atuais.media_atraso_dias_atual.toFixed(1)} dias`,
        factors: factorsFluxo(s),
      },
      segmento: s.segmento,
      perfil: s.perfil_analitico,
      insightIA: s.dados_atuais.insight_ia,
      liquidez: s.dados_atuais.indice_liquidez_1m,
      desagio: s.dados_atuais.recomendacao_desagio_percentual,
      historico: s.historico_12_meses,
      scoreDefaultAtual: sd,
      scoreFluxoAtual: sf,
    };

    map[cnpjKey] = analysis;
  });

  return map;
};

export const SACADOS_MAP = buildMap();
export const SACADOS_LIST: SacadoAnalysis[] = Object.values(SACADOS_MAP);

// Aliases — mantém os 3 CNPJs de teste antigos, apontando para perfis representativos.
const ALIASES: Record<string, string> = {
  // Excelente — Pagador Prime (SAC-002)
  "11222333000181": cleanCnpj(SACADOS[1]?.cnpj ?? "").padEnd(14, "0").slice(0, 14),
  // Bom — Risco de Fluxo Volátil (SAC-004)
  "44555666000122": cleanCnpj(SACADOS[3]?.cnpj ?? "").padEnd(14, "0").slice(0, 14),
  // Mau — Bom Pagador Outlier deteriorando (SAC-001)
  "77888999000133": cleanCnpj(SACADOS[0]?.cnpj ?? "").padEnd(14, "0").slice(0, 14),
};

export const getSacado = (cnpj: string): SacadoAnalysis | null => {
  const clean = cleanCnpj(cnpj);
  if (SACADOS_MAP[clean]) return SACADOS_MAP[clean];
  const aliased = ALIASES[clean];
  if (aliased && SACADOS_MAP[aliased]) return SACADOS_MAP[aliased];
  return null;
};
