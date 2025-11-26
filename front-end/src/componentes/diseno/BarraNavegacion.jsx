// src/componentes/diseno/BarraNavegacion.jsx
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexto/AuthContext";

export default function BarraNavegacion() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const esAdmin = Boolean(user?.is_superuser);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const estaEnLogin = location.pathname === "/login";

  // Avatar con iniciales
  const getIniciales = (texto) => {
    if (!texto) return "U";
    const base = texto.includes("@") ? texto.split("@")[0] : texto;
    const partes = base.split(/[.\s_-]+/).filter(Boolean);
    const ini = partes.slice(0, 2).map(p => p[0].toUpperCase()).join("");
    return ini || "U";
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary border-bottom">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <i className="bi bi-mortarboard-fill"></i>
          <span>Sistema PIE</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navPrincipal"
          aria-controls="navPrincipal"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div id="navPrincipal" className="collapse navbar-collapse">
          {/* Izquierda */}
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink
                to="/sostenedor"
                className={({ isActive }) =>
                  "nav-link" + (isActive ? " active fw-semibold" : "")
                }
              >
                Datos Institucional
              </NavLink>
            </li>

            {/* 👉 Link Usuarios, solo si hay sesión */}
            {isAuth && (
              <>
                {esAdmin && (
                  <li className="nav-item">
                    <NavLink
                      to="/usuarios"
                      className={({ isActive }) =>
                        "nav-link" + (isActive ? " active fw-semibold" : "")
                      }
                    >
                      Usuarios
                    </NavLink>
                  </li>
                )}

                {/* 👉 Link Registro PIE (ya agregado) */}
                <li className="nav-item">
                  <NavLink
                    to="/pie"
                    className={({ isActive }) =>
                      "nav-link" + (isActive ? " active fw-semibold" : "")
                    }
                  >
                    Registro PIE
                  </NavLink>
                </li>

                {/* 👉 NUEVO: Link Anamnesis */}
                <li className="nav-item">
                  <NavLink
                    to="/anamnesis"
                    className={({ isActive }) =>
                      "nav-link" + (isActive ? " active fw-semibold" : "")
                    }
                  >
                    Anamnesis
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          {/* Derecha */}
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            {isAuth ? (
              <li className="nav-item dropdown">
                <button
                  className="btn btn-light d-flex align-items-center gap-2 rounded-pill px-2 py-1 dropdown-toggle"
                  id="usuarioMenu"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span
                    className="d-inline-flex justify-content-center align-items-center rounded-circle bg-primary text-white"
                    style={{ width: 32, height: 32, fontSize: 12 }}
                    aria-hidden="true"
                  >
                    {getIniciales(user?.email || user?.name)}
                  </span>
                  <span className="d-none d-md-inline text-truncate" style={{ maxWidth: 180 }}>
                    {user?.name || user?.email || "Usuario"}
                  </span>
                </button>

                <ul
                  className="dropdown-menu dropdown-menu-end shadow-sm p-2"
                  aria-labelledby="usuarioMenu"
                  style={{ minWidth: 260 }}
                >
                  {/* Cabecera compacta */}
                  <li className="px-2 py-2">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="d-inline-flex justify-content-center align-items-center rounded-circle bg-primary text-white flex-shrink-0"
                        style={{ width: 36, height: 36, fontSize: 13 }}
                      >
                        {getIniciales(user?.email || user?.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="fw-semibold text-truncate">
                          {user?.name || "Usuario"}
                        </div>
                        <div className="text-muted small text-truncate">{user?.email}</div>
                      </div>
                      {user?.role && (
                        <span className="badge text-bg-light text-uppercase ms-auto">
                          {user.role}
                        </span>
                      )}
                    </div>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  {/* Acciones */}
                  {/* <li>
                    <Link className="dropdown-item d-flex align-items-center gap-2" to="/perfil">
                      <i className="bi bi-person"></i> Perfil
                    </Link>
                  </li> */}

                  <li>
                    <button
                      className="dropdown-item d-flex align-items-center gap-2 text-danger"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              !estaEnLogin && (
                <li className="nav-item">
                  <Link className="btn btn-primary btn-sm" to="/login">
                    <i className="bi bi-box-arrow-in-right me-1"></i>
                    Ingresar
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}