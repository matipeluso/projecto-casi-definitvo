// src/paginas/auth/RecuperarContrasena.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../servicios/api";

export default function RecuperarContrasena() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const tieneToken = Boolean(uid && token);

  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [clave1, setClave1] = useState("");
  const [clave2, setClave2] = useState("");
  const [cargandoReset, setCargandoReset] = useState(false);
  const [errorReset, setErrorReset] = useState("");
  const [okReset, setOkReset] = useState("");

  useEffect(() => {
    api.get("/auth/csrf/").catch(() => {});
  }, []);

  async function solicitarCorreo(e) {
    e.preventDefault();
    setMensaje("");
    setCargando(true);

    try {
      await api.post("/auth/password-reset/", { email });
      setEnviado(true);
      setMensaje("Si el correo existe, te enviaremos un enlace para restablecer la contraseña.");
    } catch (err) {
      setEnviado(true);
      setMensaje("Si el correo existe, te enviaremos un enlace para restablecer la contraseña.");
    } finally {
      setCargando(false);
    }
  }

  async function actualizarContrasena(e) {
    e.preventDefault();
    setErrorReset("");

    if (clave1 !== clave2) {
      setErrorReset("Las contraseñas no coinciden.");
      return;
    }
    if (clave1.length < 8) {
      setErrorReset("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setCargandoReset(true);
    try {
      await api.post("/auth/password-reset-confirm/", {
        uid,
        token,
        new_password: clave1,
      });
      setOkReset("Tu contraseña se actualizó correctamente. Te redirigiremos al inicio de sesión...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "El enlace no es válido o expiró.";
      setErrorReset(msg);
    } finally {
      setCargandoReset(false);
    }
  }

  return (
    <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow" style={{ maxWidth: 420, width: "100%" }}>
        <div className="card-body p-4">
          <h4 className="mb-3 text-center">
            {tieneToken ? "Crear nueva contraseña" : "Recuperar contraseña"}
          </h4>
          <p className="text-muted small">
            {tieneToken
              ? "Ingresa una nueva contraseña para continuar accediendo a la plataforma."
              : "Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña."}
          </p>

          {!tieneToken && mensaje && <div className="alert alert-info">{mensaje}</div>}
          {tieneToken && errorReset && <div className="alert alert-danger">{errorReset}</div>}
          {tieneToken && okReset && <div className="alert alert-success">{okReset}</div>}

          {!tieneToken && !enviado && (
            <form onSubmit={solicitarCorreo}>
              <div className="mb-3">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="usuario@colegio.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary w-100" disabled={cargando}>
                {cargando ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}

          {tieneToken && !okReset && (
            <form onSubmit={actualizarContrasena}>
              <div className="mb-3">
                <label className="form-label">Nueva contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  value={clave1}
                  onChange={(e) => setClave1(e.target.value)}
                  required
                />
                <div className="form-text">Mínimo 8 caracteres.</div>
              </div>
              <div className="mb-3">
                <label className="form-label">Confirmar contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  value={clave2}
                  onChange={(e) => setClave2(e.target.value)}
                  required
                />
              </div>
              <button className="btn btn-primary w-100" disabled={cargandoReset}>
                {cargandoReset ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}