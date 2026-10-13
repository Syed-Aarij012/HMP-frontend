"use client";
import { Suspense } from "react";
import AuthModalLauncher from "@/components/auth/AuthModalLauncher";
import Login from "./Login";
import Register from "./Register";
import ForgotPass from "./ForgotPass";
import ContactDealer from "./ContactDealer";
import Compare from "./Compare";

export default function AllModals() {
  return (
    <>
      <Suspense>
        <AuthModalLauncher />
      </Suspense>
      <Login />
      <Register />
      <ForgotPass />
      <ContactDealer />
      <Compare />
    </>
  );
}
