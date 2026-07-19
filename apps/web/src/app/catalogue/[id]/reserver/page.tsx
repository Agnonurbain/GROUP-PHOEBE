import { redirect } from "next/navigation";

export default async function ReserverRedirectPage() {
  redirect("/panier");
}
