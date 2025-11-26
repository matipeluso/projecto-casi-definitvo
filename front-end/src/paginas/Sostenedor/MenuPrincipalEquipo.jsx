import MenuPrincipalVista from "./MenuPrincipalVista";
import { accesosGenerales } from "./menuConfig";

export default function MenuPrincipalEquipo({ user }) {
  const heroCopy = "Centraliza la gestión del Programa de Integración Escolar y accede rápidamente a los módulos que necesitas.";
  return <MenuPrincipalVista user={user} heroCopy={heroCopy} cards={accesosGenerales} />;
}
