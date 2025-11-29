import LoginIndex from "@/components/pages/(app)/login/LoginIndex";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - SHINGRU",
};

export default function Login() {
  return <LoginIndex />;
}
