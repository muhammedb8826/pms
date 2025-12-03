"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { useAuth } from "@/features/auth/contexts/AuthContext"
import { handleApiError } from '@/lib/utils/api-error-handler';

const REDIRECT_KEY = 'login_redirect';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signin } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Get redirect destination from URL params or localStorage
  const getRedirectPath = () => {
    // Check URL search params first (e.g., /login?redirect=/purchases)
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      return redirectParam;
    }
    
    // Check localStorage for stored redirect
    if (typeof window !== 'undefined') {
      const storedRedirect = localStorage.getItem(REDIRECT_KEY);
      if (storedRedirect) {
        localStorage.removeItem(REDIRECT_KEY);
        return storedRedirect;
      }
    }
    
    // Default to dashboard
    return '/dashboard';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    try {
      await signin(email, password)
      // Get redirect path and navigate
      const redirectPath = getRedirectPath();
      router.push(redirectPath);
    } catch (err: unknown) {
      const msg = handleApiError(err, {
        defaultMessage: "Login failed",
        showToast: false, // Show error in form instead of toast
      });
      setErrorMessage(msg);
    }
    setIsLoading(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              {errorMessage ? (
                <FieldError>{errorMessage}</FieldError>
              ) : null}
              <Field>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in…" : "Login"}
                  </Button>
                  <Button variant="outline" type="button" disabled={isLoading}>
                    Login with Google
                  </Button>
                </div>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/register">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
