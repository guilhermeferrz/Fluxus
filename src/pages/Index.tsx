import { Search, Zap, ShieldCheck, TrendingUp, ArrowRight, Database } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCnpj } from "@/lib/mockData";
import { SACADOS_LIST, getSacado } from "@/lib/sacados";

const Index = () => {
  const navigate = useNavigate();
  const [cnpj, setCnpj] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 14);
    if (!digits) return setCnpj("");
    setCnpj(formatCnpj(digits));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cnpj.replace(/\D/g, "");
    if (clean.length !== 14) {
      toast.error("Informe um CNPJ válido (14 dígitos).");
      return;
    }
    if (!getSacado(clean)) {
      toast.error("CNPJ não encontrado na base de demonstração.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate(`/resultado/${clean}`);
    }, 600);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SACADOS_LIST;
    return SACADOS_LIST.filter(
      (s) =>
        s.companyName.toLowerCase().includes(q) ||
        s.cnpjFormatted.includes(q) ||
        s.segmento.toLowerCase().includes(q) ||
        s.perfil.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="min-h-screen gradient-app">
      <Header />

      <main className="container py-12 md:py-16">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center animate-fade-in">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Cockpit de Análise Operacional · FIDC Fluxus
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Nova Análise de Risco
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
            Consulte um CNPJ e receba o veredito combinando
            <span className="font-semibold text-primary"> Score Padrão</span> e
            <span className="font-semibold text-accent"> Score de Fluxo</span> com histórico de 12 meses.
          </p>
        </section>

        {/* Search Card */}
        <section className="mx-auto mt-10 max-w-2xl animate-scale-in">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-elevated md:p-8"
          >
            <label htmlFor="cnpj" className="mb-2 block text-sm font-semibold text-foreground">
              CNPJ
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cnpj"
                inputMode="numeric"
                value={cnpj}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="h-14 pl-12 text-lg font-medium tracking-wide"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="mt-4 h-14 w-full gradient-primary text-base font-semibold text-primary-foreground shadow-primary transition-transform hover:scale-[1.01] hover:opacity-95"
            >
              {loading ? (
                <>Analisando<span className="ml-2 animate-pulse">···</span></>
              ) : (
                <>Analisar CNPJ <ArrowRight className="ml-2 h-5 w-5" /></>
              )}
            </Button>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-accent" /> Resposta &lt; 5ms</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Dados Núclea</span>
              <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-success" /> Score IA Databricks</span>
            </div>
          </form>
        </section>

        {/* Base de sacados */}
        <section className="mx-auto mt-12 max-w-5xl">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Database className="h-4 w-4" />
                Base de Sacados (12 meses)
              </div>
              <h2 className="mt-1 text-2xl font-bold text-foreground">
                {SACADOS_LIST.length} sacados disponíveis para análise
              </h2>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, CNPJ, segmento…"
                className="h-11 pl-10"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((s) => {
              const dot =
                s.level === "excelente" ? "bg-success" :
                s.level === "bom" ? "bg-warning" : "bg-destructive";
              const tagBg =
                s.level === "excelente" ? "bg-success/10 text-success" :
                s.level === "bom" ? "bg-warning/15 text-warning" : "bg-destructive/10 text-destructive";

              return (
                <button
                  key={s.cnpj}
                  onClick={() => navigate(`/resultado/${s.cnpj}`)}
                  className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                        <div className="truncate font-semibold text-foreground">{s.companyName}</div>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.cnpjFormatted} · {s.segmento}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tagBg}`}>
                      {s.perfil}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                    <div className="flex gap-4">
                      <div>
                        <div className="text-muted-foreground">Padrão</div>
                        <div className="font-bold text-primary">{s.scoreDefaultAtual}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Fluxo</div>
                        <div className="font-bold text-accent">{s.scoreFluxoAtual}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Atraso</div>
                        <div className="font-bold text-foreground">{s.scoreFluxo.avgDelay}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum sacado corresponde à busca.
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
