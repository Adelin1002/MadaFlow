import type { UserType } from "./api/types";

export const USER_TYPE_LABELS: Record<UserType, string> = {
  citizen: "Citoyen",
  business: "Entreprise",
  municipal_admin: "Administrateur municipal",
  platform_admin: "Administrateur plateforme",
};
