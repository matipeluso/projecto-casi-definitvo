import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexto/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user: usuario, logout } = useAuth();

  if (!usuario) return null;

  const displayName = [usuario.first_name, usuario.last_name].filter(Boolean).join(" ")
    || usuario.username
    || usuario.email;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-dark bg-primary mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/sostenedor">
          Portal PIE
        </Link>
        <div className="d-flex align-items-center gap-3 ms-auto text-white">
          <span className="fw-semibold text-white">
            <i className="bi bi-person-circle me-1"></i>
            {displayName}
            <span className="badge bg-light text-dark ms-2">
              {usuario.is_superuser ? "Administrador" : usuario.is_staff ? "Staff" : usuario.tipo}
            </span>
            {usuario.especialidad?.nombre && (
              <span className="badge bg-info text-dark ms-2">{usuario.especialidad.nombre}</span>
            )}
            {usuario.establecimiento?.nombre && (
              <span className="badge bg-secondary text-light ms-2">{usuario.establecimiento.nombre}</span>
            )}
          </span>
          <button className="btn btn-outline-light" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i> Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
