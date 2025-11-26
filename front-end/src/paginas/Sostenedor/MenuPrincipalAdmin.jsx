import MenuPrincipalVista from "./MenuPrincipalVista";
import { accesosGenerales, accesosSoloAdmin } from "./menuConfig";

export default function MenuPrincipalAdmin({ user }) {
  const cards = [...accesosSoloAdmin, ...accesosGenerales];
  const heroCopy = "Como administrador puedes supervisar toda la plataforma y gestionar accesos para tu equipo.";
  return <MenuPrincipalVista user={user} heroCopy={heroCopy} cards={cards} />;
}
