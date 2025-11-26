// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Componentes de diseño
import Navbar from "./componentes/interfaz/Navbar";

// Páginas
import MenuPrincipal from "./paginas/Sostenedor/MenuPrincipal";
import Establecimientos from "./paginas/Establecimientos/Establecimientos";
import EstructuraDeCurso from "./paginas/Establecimientos/EstructuraDeCurso";
import Cursos from "./paginas/cursos/Cursos";
import Estudiantes from "./paginas/alumnos/Estudiantes";
import Apoderados from "./paginas/alumnos/Apoderados";
import AlumnosDelCurso from "./paginas/alumnos/AlumnosDelCurso";
import Login from "./paginas/auth/login";
import PerfilUsuario from "./paginas/perfil/PerfilUsuario";
import RecuperarContrasena from "./paginas/auth/RecuperarContrasena";
import RestablecerContrasena from "./paginas/auth/RestablecerContrasena";
import RegistroPIE from "./paginas/Pie/RegistroPIE";

import Usuarios from "./paginas/usuarios/Usuarios";

// Nueva página psicopedagógica
import EvaluacionPsicoForm from "./paginas/psicopedagogica/EvaluacionPsicoForm";
import EvaluacionPsicopedagogica from "./paginas/psicopedagogica/EvaluacionPsicopedagogica";
import SaludForm from "./paginas/salud/SaludForm";
import Anamnesis from "./paginas/Anamnesis/Anamnesis";
import InformeFamilia from "./paginas/InformesFamilia/InformeFamilia";

// Contexto de autenticación
import { AuthProvider, useAuth } from "./contexto/AuthContext";

// -------------------------------------------------------------
//  RUTA PROTEGIDA
// -------------------------------------------------------------
function ProtectedRoute({ children }) {
  const { isAuth, status } = useAuth();

  // Espera a que el contexto termine de cargar
  if (status !== "ready") return null;

  // Si no está logueado → redirige a login
  if (!isAuth) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      {children}

    </>
  );
}

// -------------------------------------------------------------
//  HOME AUTO-REDIRECT SEGÚN SESIÓN
// -------------------------------------------------------------
function HomeRedirect() {
  const { isAuth, status } = useAuth();
  if (status !== "ready") return null;
  return isAuth ? <Navigate to="/sostenedor" /> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={4000} newestOnTop pauseOnHover={false} />
        <main>
          <Routes>
            {/* Redirección según si hay sesión */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Páginas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
            <Route path="/restablecer/:uid/:token" element={<RestablecerContrasena />} />

            {/* ------------------------------------------------------ */}
            {/*            RUTAS PROTEGIDAS (REQUIERE LOGIN)            */}
            {/* ------------------------------------------------------ */}


            {/* Usuarios */}
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute>
                  <Usuarios />
                </ProtectedRoute>
              }
            />

            {/* Establecimientos */}
            <Route
              path="/establecimientos"
              element={
                <ProtectedRoute>
                  <Establecimientos />
                </ProtectedRoute>
              }
            />

            {/* Cursos */}
            <Route
              path="/cursos"
              element={
                <ProtectedRoute>
                  <Cursos />
                </ProtectedRoute>
              }
            />

            {/* Estudiantes */}
            <Route
              path="/estudiantes"
              element={
                <ProtectedRoute>
                  <Estudiantes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/apoderados"
              element={
                <ProtectedRoute>
                  <Apoderados />
                </ProtectedRoute>
              }
            />

            {/* Registro PIE */}
            <Route
              path="/registro-pie"
              element={
                <ProtectedRoute>
                  <RegistroPIE />
                </ProtectedRoute>
              }
            />

            {/* Evaluación Psicopedagógica */}
            <Route
              path="/evaluacion-psicopedagogica"
              element={
                <ProtectedRoute>
                  <EvaluacionPsicopedagogica />
                </ProtectedRoute>
              }
            />

            {/* Anamnesis */}
            <Route
              path="/anamnesis"
              element={
                <ProtectedRoute>
                  <Anamnesis />
                </ProtectedRoute>
              }
            />

            {/* Evaluación de Salud */}
            <Route
              path="/evaluacion-salud"
              element={
                <ProtectedRoute>
                  <SaludForm />
                </ProtectedRoute>
              }
            />

            {/* Informes para la familia */}
            <Route
              path="/informes-familia"
              element={
                <ProtectedRoute>
                  <InformeFamilia />
                </ProtectedRoute>
              }
            />

            {/* Menú principal */}
            <Route
              path="/sostenedor"
              element={
                <ProtectedRoute>
                  <MenuPrincipal />
                </ProtectedRoute>
              }
            />

            {/* Estructura curso */}
            <Route
              path="/establecimientos/:id/estructura"
              element={
                <ProtectedRoute>
                  <EstructuraDeCurso />
                </ProtectedRoute>
              }
            />

            {/* Alumnos de un curso */}
            <Route
              path="/establecimientos/:id/cursos/:cursoId/alumnos"
              element={
                <ProtectedRoute>
                  <AlumnosDelCurso />
                </ProtectedRoute>
              }
            />

            {/* Perfil */}
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <PerfilUsuario />
                </ProtectedRoute>
              }
            />

            {/* Página Psicopedagógica - Crear */}
            <Route
              path="/psicopedagogica/evaluaciones/nueva"
              element={
                <ProtectedRoute>
                  <EvaluacionPsicoForm />
                </ProtectedRoute>
              }
            />
            {/* Página Psicopedagógica - Editar */}
            <Route
              path="/psicopedagogica/evaluaciones/editar/:id"
              element={
                <ProtectedRoute>
                  <EvaluacionPsicoForm />
                </ProtectedRoute>
              }
            />

            {/* Fallback: cualquier ruta inválida vuelve al inicio */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

