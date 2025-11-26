import { Link } from "react-router-dom";
import { tips } from "./menuConfig";

export default function MenuPrincipalVista({ user, heroCopy, cards }) {
  if (!user) return null;
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Sostenedor";

  return (
    <div className="container py-4">
      <div
        className="bg-gradient-primary text-white rounded-4 p-4 p-lg-5 shadow-sm"
        style={{ background: "linear-gradient(120deg,#0d6efd,#6610f2)" }}
      >
        <div className="row g-4 align-items-center">
          <div className="col-lg-8">
            <p className="text-uppercase small mb-2">Bienvenido</p>
            <h1 className="fw-bold mb-3">Hola, {displayName}</h1>
            <p className="fs-5 mb-0">{heroCopy}</p>
          </div>
          <div className="col-lg-4 text-lg-end">
            <Link to="/perfil" className="btn btn-light btn-lg fw-semibold">
              <i className="bi bi-person-badge me-2"></i>Ver perfil
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-5">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div>
            <h2 className="h4 fw-semibold mb-0">Accesos rápidos</h2>
            <p className="text-muted mb-0">Elige el módulo que necesitas hoy</p>
          </div>
        </div>
        <div className="row g-4">
          {cards.map((item) => (
            <div className="col-12 col-md-6 col-xl-4" key={item.title}>
              <Link to={item.to} className="text-decoration-none">
                <div className="card h-100 border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div
                      className={`d-inline-flex align-items-center justify-content-center rounded-3 text-${item.color} bg-${item.color} bg-opacity-10 mb-3`}
                      style={{ width: 52, height: 52 }}
                    >
                      <i className={`bi ${item.icon} fs-4`}></i>
                    </div>
                    <h5 className="fw-semibold text-dark">{item.title}</h5>
                    <p className="text-muted mb-0">{item.description}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 row g-4">
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-3">Estado general</h5>
              <div className="row g-3">
                <div className="col-6">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <p className="text-muted mb-1">Registros PIE</p>
                    <p className="h3 fw-bold text-primary">8</p>
                    <small className="text-muted">en progreso</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded-3 p-3 text-center bg-light">
                    <p className="text-muted mb-1">Evaluaciones</p>
                    <p className="h3 fw-bold text-success">12</p>
                    <small className="text-muted">últimos 30 días</small>
                  </div>
                </div>
                <div className="col-12">
                  <div className="alert alert-primary mb-0">
                    <div className="d-flex align-items-center gap-3">
                      <i className="bi bi-info-circle fs-4"></i>
                      <div>
                        <strong>Recuerda:</strong> puedes descargar el PDF oficial del Registro PIE una vez guardadas todas las secciones.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <h5 className="fw-semibold mb-3">Sugerencias rápidas</h5>
              <ul className="list-group list-group-flush">
                {tips.map((tip) => (
                  <li className="list-group-item" key={tip.title}>
                    <h6 className="fw-semibold mb-1">{tip.title}</h6>
                    <p className="text-muted mb-0">{tip.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
