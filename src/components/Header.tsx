import logo from "@/assets/fluxus-logo.png";
import { User } from "lucide-react";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <img src={logo} alt="Fluxus" width={36} height={36} className="h-9 w-9" />
          <span className="text-xl font-bold tracking-tight text-foreground">FLUXUS</span>
        </Link>
        <button
          aria-label="Perfil do usuário"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:bg-muted"
        >
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
