import LoginIndex from "@/components/pages/(app)/login/LoginIndex";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Vault",
};

export default function Login() {
  return <LoginIndex />;
}
