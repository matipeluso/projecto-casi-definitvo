import { useAuth } from "../../contexto/AuthContext";
import MenuPrincipalAdmin from "./MenuPrincipalAdmin";
import MenuPrincipalEquipo from "./MenuPrincipalEquipo";

export default function MenuPrincipal() {
  const { user } = useAuth();
  if (!user) return null;
  const esAdmin = Boolean(user?.is_superuser);
  return esAdmin ? <MenuPrincipalAdmin user={user} /> : <MenuPrincipalEquipo user={user} />;
}
