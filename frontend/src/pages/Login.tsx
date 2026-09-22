import { useCallback, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBranding } from "../context/BrandingContext";
import { assetUrl } from "../api/client";
import AuthLayout from "../components/AuthLayout";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { extractErrorMessage } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { settings } = useBranding();
  const navigate = useNavigate();

  const handleGoogleCredential = useCallback(
    async (idToken: string) => {
      setError(null);
      try {
        await loginWithGoogle(idToken);
        navigate("/");
      } catch (err: any) {
        setError(extractErrorMessage(err) || "Nao foi possivel entrar com o Google.");
      }
    },
    [loginWithGoogle, navigate]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 423) {
        setError("Conta bloqueada temporariamente por excesso de tentativas.");
      } else {
        setError("Email ou senha invalidos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {settings?.logo_url ? (
        <img src={assetUrl(settings.logo_url)} alt="Logo" className="auth-logo" />
      ) : (
        <div className="auth-badge">PB</div>
      )}
      <h1 className="auth-title">Entrar no {settings?.company_name || "PBIHoster"}</h1>
      <p className="auth-subtitle">Acesse seus relatorios e workspaces</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label className="field">
          Email
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@empresa.com"
            required
          />
        </label>
        <label className="field">
          Senha
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {settings?.google_oauth_enabled && settings.google_client_id && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div className="auth-divider">ou</div>
          <GoogleLoginButton clientId={settings.google_client_id} onCredential={handleGoogleCredential} />
        </div>
      )}

      {settings?.allow_registration && (
        <p className="auth-footer">
          Nao tem conta? <Link to="/register">Criar conta</Link>
        </p>
      )}
    </AuthLayout>
  );
}
