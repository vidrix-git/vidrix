import { useState } from "react";
import { useLocation } from "wouter";
import { useLocalLogin } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, LogIn } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, register } = useLocalLogin();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Preencha usuário e senha");
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }
      if (password.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres");
        return;
      }
      try {
        await register.mutateAsync({
          username: username.trim(),
          password,
        });
        toast.success("Usuário criado com sucesso! Faça login.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      } catch (err: any) {
        const msg = err?.message || "Erro ao criar usuário. Usuário pode já existir.";
        toast.error(msg);
      }
      return;
    }

    try {
      const result = await login.mutateAsync({ username: username.trim(), password });
      if (result.success) {
        // Store token in localStorage as fallback
        localStorage.setItem("vidrix-token", result.token);
        toast.success(`Bem-vindo, ${result.user.name || result.user.email || "Usuário"}!`);
        setLocation("/");
      } else {
        toast.error("Falha na autenticação");
      }
    } catch (err: any) {
      const msg = err?.message || "Usuário ou senha inválidos";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Vidrix</h1>
          <p className="text-slate-400 mt-1">Sistema de Gestão para Vidraçaria</p>
        </div>

        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {mode === "login" ? (
                <>
                  <LogIn className="w-5 h-5" /> Entrar
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" /> Criar Conta
                </>
              )}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {mode === "login"
                ? "Faça login para acessar o sistema"
                : "Crie sua conta para começar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">
                  Usuário
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua senha"
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                    autoComplete="new-password"
                  />
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500"
                disabled={isPending || login.isPending || register.isPending}
              >
                {(login.isPending || register.isPending) ? "Processando..." : mode === "login" ? "Entrar" : "Criar Conta"}
              </Button>
            </form>
            <Separator className="my-4 bg-slate-700" />
            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
              >
                {mode === "login"
                  ? "Não tem conta? Crie uma agora"
                  : "Já tem conta? Faça login"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
