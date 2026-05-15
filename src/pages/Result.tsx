import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Building2, CheckCircle2, AlertTriangle, XCircle,
  TrendingUp, TrendingDown, Minus, Clock, Sparkles, Activity, BarChart3,
  Calculator, DollarSign, Zap,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, BarChart, Bar, ReferenceLine, Legend,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import { Header } from "@/components/Header";
import type { RiskLevel } from "@/lib/mockData";
import { getSacado } from "@/lib/sacados";
import { analisarCnpj } from "@/services/api";

const levelStyles: Record<RiskLevel, {
  verdictBg: string; verdictBorder: string; iconWrap: string; icon: JSX.Element;
  badgeBg: string; badgeText: string;
  padraoGradient: string; fluxoGradient: string;
}> = {
  excelente: {
    verdictBg: "bg-success/5",
    verdictBorder: "border-l-success",
    iconWrap: "bg-success/10 text-success",
    icon: <CheckCircle2 className="h-8 w-8" />,
    badgeBg: "bg-success/15",
    badgeText: "text-success",
    padraoGradient: "gradient-primary",
    fluxoGradient: "gradient-accent",
  },
  bom: {
    verdictBg: "bg-warning/5",
    verdictBorder: "border-l-warning",
    iconWrap: "bg-warning/15 text-warning",
    icon: <AlertTriangle className="h-8 w-8" />,
    badgeBg: "bg-warning/20",
    badgeText: "text-warning",
    padraoGradient: "gradient-primary",
    fluxoGradient: "gradient-accent",
  },
  mau: {
    verdictBg: "bg-destructive/5",
    verdictBorder: "border-l-destructive",
    iconWrap: "bg-destructive/10 text-destructive",
    icon: <XCircle className="h-8 w-8" />,
    badgeBg: "bg-destructive/15",
    badgeText: "text-destructive",
    padraoGradient: "gradient-danger",
    fluxoGradient: "gradient-danger",
  },
};

const TrendIcon = ({ t, invert = false }: { t: "Alta" | "Estável" | "Baixa"; invert?: boolean }) => {
  const good = invert ? "text-destructive" : "text-success";
  const bad = invert ? "text-success" : "text-destructive";
  if (t === "Alta") return <TrendingUp className={`h-4 w-4 ${good}`} />;
  if (t === "Baixa") return <TrendingDown className={`h-4 w-4 ${bad}`} />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const trendClass = (t: "Alta" | "Estável" | "Baixa", invert = false) => {
  if (t === "Estável") return "text-muted-foreground";
  if (invert) return t === "Alta" ? "text-destructive" : "text-success";
  return t === "Alta" ? "text-success" : "text-destructive";
};

type ChartView = "scores" | "atraso" | "volume";

const formatBRL = (n: number) =>
  n >= 1_000_000 ? `R$${(n / 1_000_000).toFixed(1)}M` :
  n >= 1_000 ? `R$${(n / 1_000).toFixed(0)}k` : `R$${n}`;

const isValidResultData = (value: unknown): value is NonNullable<ReturnType<typeof getSacado>> => {
  const item = value as NonNullable<ReturnType<typeof getSacado>> | null;
  return Boolean(
    item &&
      item.companyName &&
      item.cnpjFormatted &&
      item.verdict &&
      Array.isArray(item.historico) &&
      item.scorePadrao &&
      item.scoreFluxo
  );
};

const Result = () => {
  const { cnpj } = useParams<{ cnpj: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<NonNullable<ReturnType<typeof getSacado>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [view, setView] = useState<ChartView>("scores");

  useEffect(() => {
    if (!cnpj) {
      navigate("/", { replace: true });
      return;
    }

    let active = true;

    async function carregarResultado() {
      setLoading(true);
      setApiWarning(null);

      try {
        const apiData = await analisarCnpj(cnpj);

        if (isValidResultData(apiData)) {
          if (active) setData(apiData);
          return;
        }

        throw new Error("A API respondeu, mas o formato dos dados ainda não está compatível com a tela.");
      } catch (error) {
        console.error("Erro ao consultar API. Usando mock como fallback:", error);

        const fallbackData = getSacado(cnpj);

        if (!active) return;

        if (fallbackData) {
          setData(fallbackData);
          setApiWarning("API consultada, mas esta tela ainda está exibindo dados mockados como fallback.");
        } else {
          navigate("/", { replace: true });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    carregarResultado();

    return () => {
      active = false;
    };
  }, [cnpj, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-app">
        <Header />
        <main className="container max-w-6xl py-8 md:py-10">
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
            Consultando API e carregando análise...
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;
  const s = levelStyles[data.level];

  return (
    <div className="min-h-screen gradient-app">
      <Header />

      <main className="container max-w-6xl py-8 md:py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para busca
        </Link>

        {apiWarning && (
          <div className="mb-5 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm font-medium text-warning">
            {apiWarning}
          </div>
        )}

        {/* Company */}
        <section className="animate-fade-in rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground md:text-2xl">{data.companyName}</h1>
                <p className="text-sm text-muted-foreground">
                  CNPJ: {data.cnpjFormatted} · {data.segmento}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
              {data.perfil}
            </span>
          </div>
        </section>

        {/* Verdict */}
        <section
          className={`mt-5 animate-fade-in rounded-2xl border border-border ${s.verdictBg} border-l-[6px] ${s.verdictBorder} p-6 shadow-card md:p-8`}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card ${s.iconWrap} shadow-card`}>
              {s.icon}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-bold text-foreground">Veredito</h2>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${s.badgeBg} ${s.badgeText}`}>
                  {data.verdict.title}
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {data.verdict.description}
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <Metric label="Probabilidade" value={`${data.verdict.probability}%`} />
                <Metric label="Confiança" value={`${data.verdict.confidence}%`} />
                <Metric label="Liquidez 1m" value={`${(data.liquidez * 100).toFixed(0)}%`} />
                <Metric label="Deságio" value={`${data.desagio.toFixed(2)}%`} highlight />
              </div>
            </div>
          </div>
        </section>

        {/* Insight IA */}
        <section className="mt-5 animate-fade-in rounded-2xl border border-accent/30 bg-accent/5 p-5 shadow-card md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-accent">Insight IA · Databricks</div>
              <p className="mt-1 text-sm leading-relaxed text-foreground md:text-base">{data.insightIA}</p>
            </div>
          </div>
        </section>

        {/* Histórico interativo */}
        <section className="mt-5 animate-scale-in rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Histórico — Últimos 12 meses</h3>
            </div>
            <div className="inline-flex rounded-lg border border-border bg-background p-1">
              <ChartTab active={view === "scores"} onClick={() => setView("scores")} icon={<TrendingUp className="h-3.5 w-3.5" />}>
                Scores
              </ChartTab>
              <ChartTab active={view === "atraso"} onClick={() => setView("atraso")} icon={<Clock className="h-3.5 w-3.5" />}>
                Atraso
              </ChartTab>
              <ChartTab active={view === "volume"} onClick={() => setView("volume")} icon={<BarChart3 className="h-3.5 w-3.5" />}>
                Volume
              </ChartTab>
            </div>
          </div>

          <div className="mt-5 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {view === "scores" ? (
                <LineChart data={data.historico} margin={{ top: 10, right: 12, bottom: 0, left: -8 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone" dataKey="score_default" name="Score Padrão"
                    stroke="hsl(var(--primary))" strokeWidth={2.5}
                    dot={{ r: 3 }} activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone" dataKey="score_fluxo" name="Score Fluxo (risco)"
                    stroke="hsl(var(--accent))" strokeWidth={2.5}
                    dot={{ r: 3 }} activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : view === "atraso" ? (
                <AreaChart data={data.historico} margin={{ top: 10, right: 12, bottom: 0, left: -8 }}>
                  <defs>
                    <linearGradient id="atrasoFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="d" />
                  <Tooltip content={<CustomTooltip suffix=" dias" />} />
                  <ReferenceLine y={15} stroke="hsl(var(--warning))" strokeDasharray="4 4" label={{ value: "Limite saudável", fill: "hsl(var(--warning))", fontSize: 11, position: "right" }} />
                  <Area
                    type="monotone" dataKey="media_atraso_dias" name="Média de atraso"
                    stroke="hsl(var(--accent))" strokeWidth={2.5}
                    fill="url(#atrasoFill)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={data.historico} margin={{ top: 10, right: 12, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatBRL} />
                  <Tooltip content={<CustomTooltip currency />} />
                  <Bar
                    dataKey="volume_transacionado_brl" name="Volume transacionado"
                    fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Scores */}
        <section className="mt-5 grid gap-5 md:grid-cols-2">
          {/* Score Padrão */}
          <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card animate-scale-in">
            <header className={`relative ${s.padraoGradient} p-6 text-primary-foreground`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold opacity-90">Score Padrão</p>
                  <div className="mt-2 text-6xl font-black leading-none tracking-tight">
                    {data.scorePadrao.value}
                  </div>
                  <p className="mt-2 text-sm opacity-90">{data.scorePadrao.label}</p>
                </div>
                <TrendIcon t={data.scorePadrao.trend} />
              </div>
            </header>

            <div className="space-y-4 p-6">
              <ProgressBar value={data.scorePadrao.value} className="gradient-primary" />

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Score (0-100)" value={`${data.scoreDefaultAtual}`} />
                <MiniStat
                  label="Tendência 12m"
                  value={data.scorePadrao.trend}
                  className={trendClass(data.scorePadrao.trend)}
                  icon={<TrendIcon t={data.scorePadrao.trend} />}
                />
              </div>

              <FactorList items={data.scorePadrao.factors} dot="bg-primary" />
            </div>
          </article>

          {/* Score Fluxo (Risco) — alto = RUIM */}
          <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated animate-scale-in">
            <header className={`relative ${s.fluxoGradient} p-6 text-accent-foreground`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold opacity-95">Score Fluxo · Risco de Atraso</p>
                  <div className="mt-2 text-7xl font-black leading-none tracking-tight">
                    {data.scoreFluxo.value}
                  </div>
                  <p className="mt-2 text-sm opacity-95">{data.scoreFluxo.label}</p>
                </div>
                {/* Para risco: Alta = ruim (vermelho), Baixa = bom (verde) — invertido */}
                <TrendIcon t={data.scoreFluxo.trend} invert />
              </div>
            </header>

            <div className="space-y-4 p-6">
              <ProgressBar value={data.scoreFluxo.value} className="gradient-accent" />

              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Risco fluxo (0-100)" value={`${data.scoreFluxoAtual}`} />
                <MiniStat
                  label="Tendência 12m"
                  value={data.scoreFluxo.trend}
                  className={trendClass(data.scoreFluxo.trend, true)}
                  icon={<TrendIcon t={data.scoreFluxo.trend} invert />}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clock className="h-4 w-4 text-accent" />
                  Média de atraso atual
                </div>
                <div className="text-base font-bold text-accent">{data.scoreFluxo.avgDelay}</div>
              </div>

              <FactorList items={data.scoreFluxo.factors} dot="bg-accent" />
            </div>
          </article>
        </section>

        {/* Simulador de Deságio */}
        <DesagioSimulator
          desagio={data.desagio}
          level={data.level}
          companyName={data.companyName}
        />
      </main>
    </div>
  );
};

const Metric = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`mt-1 text-2xl font-bold ${highlight ? "text-accent" : "text-foreground"}`}>{value}</div>
  </div>
);

const MiniStat = ({
  label, value, icon, className = "text-foreground",
}: { label: string; value: string; icon?: JSX.Element; className?: string }) => (
  <div className="rounded-lg border border-border p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className={`mt-0.5 flex items-center gap-1.5 text-xl font-bold ${className}`}>
      {icon} {value}
    </div>
  </div>
);

const ProgressBar = ({ value, className }: { value: number; className: string }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Pontuação</span>
      <span className="font-semibold text-foreground">{value}/1000</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div
        className={`h-full transition-all duration-700 ${className}`}
        style={{ width: `${(value / 1000) * 100}%` }}
      />
    </div>
  </div>
);

const FactorList = ({ items, dot }: { items: string[]; dot: string }) => (
  <div>
    <h4 className="mb-2 text-sm font-semibold text-foreground">Fatores Principais</h4>
    <ul className="space-y-1.5">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          {f}
        </li>
      ))}
    </ul>
  </div>
);

const ChartTab = ({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: JSX.Element; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
      active
        ? "bg-primary text-primary-foreground shadow-card"
        : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {icon} {children}
  </button>
);

const CustomTooltip = ({
  active, payload, label, suffix = "", currency = false,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  suffix?: string;
  currency?: boolean;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-elevated">
      <div className="text-xs font-semibold text-foreground">{label}</div>
      <div className="mt-1 space-y-0.5">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-bold text-foreground">
              {currency ? formatBRL(p.value) : `${p.value}${suffix}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Simulador de Deságio — A "Máquina de Dinheiro" do FIDC
// ============================================================
const TAXA_MERCADO_PADRAO = 2.85; // % a.m. — taxa cega de mercado (sem Fluxus)

const DesagioSimulator = ({
  desagio,
  level,
  companyName,
}: {
  desagio: number;
  level: RiskLevel;
  companyName: string;
}) => {
  const [valor, setValor] = useState(100_000);

  const isHighRisk = level === "mau";
  const taxaIA = desagio;
  const taxaMercado = TAXA_MERCADO_PADRAO;

  const valorPagoMercado = valor * (1 - taxaMercado / 100);
  const valorPagoIA = valor * (1 - taxaIA / 100);

  const ganho = isHighRisk
    ? valorPagoMercado - valorPagoIA
    : valorPagoIA - valorPagoMercado;

  const ganhoAbs = Math.abs(ganho);
  const ganhoPct = (ganhoAbs / valor) * 100;

  const fmtMoney = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const ganhoLabel = isHighRisk ? "Perda evitada pelo FIDC" : "Vantagem competitiva do FIDC";
  const ganhoSubtitle = isHighRisk
    ? "Aplicando o deságio sugerido pela IA, o fundo se protege contra a deterioração do fluxo deste sacado."
    : "Aplicando o deságio justo da IA (vs taxa cega de mercado), o fundo precifica melhor e captura margem.";

  return (
    <section className="mt-5 animate-fade-in overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
      <header className="gradient-primary p-6 text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/15">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold md:text-2xl">Simulador de Deságio</h3>
            <p className="text-sm opacity-90">
              Quanto o FIDC ganha aplicando a taxa sugerida pela IA em um título de {companyName}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Valor do título</label>
              <span className="text-2xl font-black text-primary tabular-nums">{fmtMoney(valor)}</span>
            </div>
            <Slider
              value={[valor]}
              min={10_000}
              max={1_000_000}
              step={5_000}
              onValueChange={(v) => setValor(v[0])}
              className="mt-3"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>R$ 10 mil</span>
              <span>R$ 1 milhão</span>
            </div>
          </div>

          <div className="grid gap-3">
            <RateRow
              label="Taxa cega de mercado"
              sub="FIDC sem inteligência transacional"
              rate={taxaMercado}
              tone="muted"
            />
            <RateRow
              label="Deságio sugerido pela IA"
              sub="Calibrado por scores Padrão + Fluxo"
              rate={taxaIA}
              tone="accent"
              icon={<Zap className="h-4 w-4" />}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <PayoutCard label="Pagaria (mercado)" value={fmtMoney(valorPagoMercado)} tone="muted" />
            <PayoutCard label="Paga (IA Fluxus)" value={fmtMoney(valorPagoIA)} tone="primary" />
          </div>

          <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-success">
              <DollarSign className="h-4 w-4" />
              {ganhoLabel}
            </div>
            <div className="mt-2 text-4xl font-black text-success tabular-nums md:text-5xl">
              {fmtMoney(ganhoAbs)}
            </div>
            <div className="mt-1 text-sm font-semibold text-success/80">
              {ganhoPct.toFixed(2)}% sobre o valor do título
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{ganhoSubtitle}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const RateRow = ({
  label, sub, rate, tone, icon,
}: {
  label: string; sub: string; rate: number;
  tone: "muted" | "accent"; icon?: JSX.Element;
}) => (
  <div
    className={`flex items-center justify-between rounded-xl border p-4 ${
      tone === "accent" ? "border-accent/40 bg-accent/5" : "border-border bg-secondary/40"
    }`}
  >
    <div>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {icon} {label}
      </div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
    <div
      className={`text-2xl font-black tabular-nums ${
        tone === "accent" ? "text-accent" : "text-muted-foreground"
      }`}
    >
      {rate.toFixed(2)}%
    </div>
  </div>
);

const PayoutCard = ({
  label, value, tone,
}: { label: string; value: string; tone: "muted" | "primary" }) => (
  <div
    className={`rounded-xl border p-4 ${
      tone === "primary" ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30"
    }`}
  >
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    <div
      className={`mt-1 text-xl font-bold tabular-nums ${
        tone === "primary" ? "text-primary" : "text-foreground"
      }`}
    >
      {value}
    </div>
  </div>
);

export default Result;

