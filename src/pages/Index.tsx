import { Search, Zap, ShieldCheck, TrendingUp, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCnpj } from "@/lib/mockData";

const Index = () => {
  const navigate = useNavigate();
  const [cnpj, setCnpj] = useState("");
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

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigate(`/resultado/${clean}`);
    }, 600);
  };

  return (
    <div className="min-h-screen gradient-app">
      <Header />

      <main className="container py-12 md:py-20">
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
            <span className="font-semibold text-accent"> Score de Fluxo</span> com dados reais da API.
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
              <span className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-accent" /> Consulta via API
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Feature Store Redis
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-success" /> Score IA Databricks
              </span>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Index;
