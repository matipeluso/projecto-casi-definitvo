import { Link } from "react-router-dom";
import { useAuth } from "../../contexto/AuthContext";

export default function PerfilUsuario() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">No pudimos cargar la información del usuario.</div>
      </div>
    );
  }

  const nombreCompleto = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;
  const rolLegible = user.is_superuser ? "Administrador" : user.is_staff ? "Equipo Staff" : user.tipo || "Usuario";
  const especialidad = user.especialidad?.nombre;
  const establecimiento = user.establecimiento?.nombre;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="text-uppercase text-muted small mb-1">Cuenta</p>
          <h1 className="h3 mb-0">Mi Perfil</h1>
          <p className="text-muted mb-0">Gestiona tu información y accesos a la plataforma</p>
        </div>
        <Link to="/recuperar-contrasena" className="btn btn-primary">
          <i className="bi bi-shield-lock me-2"></i> Cambiar contraseña
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-3">Información personal</h5>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="text-uppercase text-muted small">Nombre completo</label>
                  <p className="fw-semibold mb-0">{nombreCompleto}</p>
                </div>
                <div className="col-sm-6">
                  <label className="text-uppercase text-muted small">Correo electrónico</label>
                  <p className="fw-semibold mb-0">{user.email}</p>
                </div>
                <div className="col-sm-6">
                  <label className="text-uppercase text-muted small">Nombre de usuario</label>
                  <p className="mb-0">{user.username}</p>
                </div>
                {user.rut && (
                  <div className="col-sm-6">
                    <label className="text-uppercase text-muted small">RUT</label>
                    <p className="mb-0">{user.rut}</p>
                  </div>
                )}
                {user.phone && (
                  <div className="col-sm-6">
                    <label className="text-uppercase text-muted small">Teléfono</label>
                    <p className="mb-0">{user.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-3">Rol y pertenencia</h5>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <span className="text-muted">Rol</span>
                  <span className="fw-semibold">{rolLegible}</span>
                </li>
                {especialidad && (
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Especialidad</span>
                    <span className="fw-semibold">{especialidad}</span>
                  </li>
                )}
                {establecimiento && (
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-muted">Establecimiento</span>
                    <span className="fw-semibold text-end">{establecimiento}</span>
                  </li>
                )}
                {Array.isArray(user.permisos) && (
                  <li className="list-group-item">
                    <span className="text-muted d-block mb-2">Permisos</span>
                    <div className="d-flex flex-wrap gap-2">
                      {user.permisos.map((permiso) => (
                        <span key={permiso} className="badge bg-light text-dark border">
                          {permiso}
                        </span>
                      ))}
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mt-1 mt-lg-4">
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-3">Seguridad de la cuenta</h5>
              <p className="text-muted small">
                Si sospechas que alguien accedió a tu cuenta, cambia la contraseña inmediatamente y contacta al administrador del PIE.
              </p>
              <div className="d-flex gap-2 flex-wrap">
                <Link to="/recuperar-contrasena" className="btn btn-outline-primary">
                  <i className="bi bi-lock"></i> Restablecer contraseña
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-3">Accesos recientes</h5>
              <p className="text-muted small mb-4">
                Esta sección mostrará historial de inicios de sesión cuando el backend exponga esa información.
              </p>
              <div className="alert alert-secondary mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Última actualización del perfil: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}