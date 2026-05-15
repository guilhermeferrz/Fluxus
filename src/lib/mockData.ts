export type RiskLevel = "excelente" | "bom" | "mau";

export interface AnalysisData {
  cnpj: string;
  cnpjFormatted: string;
  companyName: string;
  level: RiskLevel;
  verdict: {
    title: string;
    badge: string;
    description: string;
    probability: number;  // % aprovação / risco
    confidence: number;
    risk: string;
  };
  scorePadrao: {
    value: number;
    label: string;
    probability: number;
    trend: "Alta" | "Estável" | "Baixa";
    factors: string[];
  };
  scoreFluxo: {
    value: number;
    label: string;
    probability: number;
    trend: "Alta" | "Estável" | "Baixa";
    avgDelay: string;
    factors: string[];
  };
}

export const formatCnpj = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 14).padEnd(14, "0");
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
};

export const MOCK_DATA: Record<string, AnalysisData> = {
  "11222333000181": {
    cnpj: "11222333000181",
    cnpjFormatted: "11.222.333/0001-81",
    companyName: "Núclea Fluxos S.A.",
    level: "excelente",
    verdict: {
      title: "Aprovado",
      badge: "Bom Pagador",
      description:
        "A análise indica que a empresa apresenta excelente saúde financeira e capacidade de pagamento robusta. Recomendamos a aprovação do crédito com condições preferenciais.",
      probability: 94,
      confidence: 96,
      risk: "Muito Baixo",
    },
    scorePadrao: {
      value: 850,
      label: "Excelente Pontuação",
      probability: 92,
      trend: "Alta",
      factors: [
        "Histórico de pagamentos impecável",
        "Zero ocorrências de inadimplência",
        "Mais de 10 anos de mercado consolidado",
      ],
    },
    scoreFluxo: {
      value: 880,
      label: "Excelente Pontuação",
      probability: 95,
      trend: "Alta",
      avgDelay: "0,4 dias",
      factors: [
        "Fluxo de caixa altamente consistente",
        "Receita recorrente em forte crescimento",
        "Gestão de capital de giro exemplar",
      ],
    },
  },
  "44555666000122": {
    cnpj: "44555666000122",
    cnpjFormatted: "44.555.666/0001-22",
    companyName: "Comércio Aurora Ltda",
    level: "bom",
    verdict: {
      title: "Aprovado com Cautela",
      badge: "Pagador Médio",
      description:
        "A empresa demonstra capacidade de pagamento adequada, mas apresenta sinais pontuais de oscilação no fluxo. Recomendamos aprovação com limites moderados e monitoramento.",
      probability: 72,
      confidence: 81,
      risk: "Moderado",
    },
    scorePadrao: {
      value: 650,
      label: "Boa Pontuação",
      probability: 70,
      trend: "Estável",
      factors: [
        "Histórico de pagamentos majoritariamente positivo",
        "Pequenas ocorrências de atraso em 12 meses",
        "Tempo de mercado adequado",
      ],
    },
    scoreFluxo: {
      value: 640,
      label: "Boa Pontuação",
      probability: 68,
      trend: "Estável",
      avgDelay: "5,2 dias",
      factors: [
        "Fluxo de caixa com sazonalidade marcada",
        "Receita estável, mas concentrada em poucos clientes",
        "Capital de giro adequado, com folga limitada",
      ],
    },
  },
  "77888999000133": {
    cnpj: "77888999000133",
    cnpjFormatted: "77.888.999/0001-33",
    companyName: "Distribuidora Sigma EIRELI",
    level: "mau",
    verdict: {
      title: "Reprovado",
      badge: "Mau Pagador Outlier",
      description:
        "A análise identifica risco elevado de inadimplência. A empresa apresenta deterioração no fluxo de caixa e histórico recente de atrasos significativos. Recomendamos a recusa do crédito ou revisão profunda das garantias.",
      probability: 28,
      confidence: 89,
      risk: "Muito Alto",
    },
    scorePadrao: {
      value: 350,
      label: "Pontuação Crítica",
      probability: 32,
      trend: "Baixa",
      factors: [
        "Histórico recente com múltiplos atrasos",
        "Índice de inadimplência acima da média",
        "Endividamento elevado em relação ao faturamento",
      ],
    },
    scoreFluxo: {
      value: 290,
      label: "Alerta de Atraso Crítico",
      probability: 24,
      trend: "Baixa",
      avgDelay: "27,8 dias",
      factors: [
        "Média de atraso de 27 dias",
        "Perda de rentabilidade detectada",
      ],
    },
  },
};

export const getAnalysis = (cnpj: string): AnalysisData | null => {
  const clean = cnpj.replace(/\D/g, "");
  return MOCK_DATA[clean] ?? null;
};
