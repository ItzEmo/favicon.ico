import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin-auth"
import { AdminLoginForm } from "@/components/admin-login-form"

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
}

export default async function BackstagePage() {
  if (await isAdmin()) redirect("/admin")
  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center bg-background px-4 py-12">
      <AdminLoginForm />
    </div>
  )
}
