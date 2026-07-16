"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  api,
  getApiErrorMessage,
} from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type {
  LoginResponse,
  User,
} from "@/types/auth";

const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(
        2,
        "Full name must contain at least 2 characters.",
      )
      .max(
        120,
        "Full name is too long.",
      ),
    email: z
      .string()
      .trim()
      .email(
        "Enter a valid email address.",
      ),
    password: z
      .string()
      .min(
        8,
        "Password must contain at least 8 characters.",
      )
      .regex(
        /[A-Z]/,
        "Password must contain one uppercase letter.",
      )
      .regex(
        /[a-z]/,
        "Password must contain one lowercase letter.",
      )
      .regex(
        /\d/,
        "Password must contain one number.",
      ),
    confirm_password: z
      .string()
      .min(
        8,
        "Confirm your password.",
      ),
  })
  .refine(
    (values) =>
      values.password ===
      values.confirm_password,
    {
      message:
        "Passwords do not match.",
      path: [
        "confirm_password",
      ],
    },
  );

type RegisterFormValues = z.infer<
  typeof registerSchema
>;

const platformFeatures = [
  "Secure multi-tenant workspace",
  "Enterprise RAG and grounded citations",
  "Conversation history and streaming AI",
];

export default function RegisterPage() {
  const router = useRouter();

  const setAuth = useAuthStore(
    (state) => state.setAuth,
  );

  const setUser = useAuthStore(
    (state) => state.setUser,
  );

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<RegisterFormValues>(
      {
        resolver:
          zodResolver(
            registerSchema,
          ),
        defaultValues: {
          full_name: "",
          email: "",
          password: "",
          confirm_password: "",
        },
      },
    );

  async function onSubmit(
    values: RegisterFormValues,
  ): Promise<void> {
    try {
      const payload = {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      };

      const registerResponse =
        await api.post<LoginResponse>(
          "/auth/register",
          payload,
        );

      const tokens =
        registerResponse.data;

      setAuth(
        tokens,
        tokens.user ?? null,
      );

      if (!tokens.user) {
        const userResponse =
          await api.get<User>(
            "/users/me",
          );

        setUser(
          userResponse.data,
        );
      }

      toast.success(
        "Your NexusAI account has been created.",
      );

      router.replace(
        "/dashboard",
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
        ),
      );
    }
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="enterprise-grid relative hidden min-h-screen overflow-hidden bg-[#101828] px-12 py-10 text-white lg:flex lg:flex-col">
        <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute bottom-8 right-0 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur">
            <Bot className="h-6 w-6" />
          </div>

          <div>
            <p className="text-lg font-semibold tracking-tight">
              NexusAI Enterprise
            </p>

            <p className="text-xs text-white/55">
              Trustworthy agentic intelligence
            </p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-1.5 text-sm text-violet-100">
            <Sparkles className="h-4 w-4" />
            Enterprise AI control plane
          </div>

          <h1 className="max-w-xl text-5xl font-semibold leading-[1.08] tracking-[-0.045em]">
            Start building trustworthy AI systems.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">
            Create a secure workspace for projects,
            knowledge bases, document intelligence and
            enterprise-grade AI conversations.
          </p>

          <div className="mt-10 space-y-4">
            {platformFeatures.map(
              (feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />

                  <p className="text-sm leading-6 text-white/75">
                    {feature}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-white/45">
          <span>
            Secure by design
          </span>

          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Enterprise-grade controls
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <Bot className="h-6 w-6" />
            </div>

            <div>
              <p className="font-semibold">
                NexusAI Enterprise
              </p>

              <p className="text-xs text-slate-500">
                Secure AI Workspace
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-violet-700">
              Create your workspace
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Create an account
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Start managing your enterprise AI projects,
              knowledge bases and conversations.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(
              onSubmit,
            )}
            className="mt-8 space-y-4"
          >
            <div>
              <label
                htmlFor="full_name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="Vivek Mane"
                  {...register(
                    "full_name",
                  )}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              {errors.full_name && (
                <p className="mt-2 text-sm text-red-600">
                  {
                    errors
                      .full_name
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Work email
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register(
                    "email",
                  )}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              {errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {
                    errors.email
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  {...register(
                    "password",
                  )}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {
                    errors
                      .password
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirm_password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="confirm_password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  {...register(
                    "confirm_password",
                  )}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />

                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirmed password"
                      : "Show confirmed password"
                  }
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current,
                    )
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {errors.confirm_password && (
                <p className="mt-2 text-sm text-red-600">
                  {
                    errors
                      .confirm_password
                      .message
                  }
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-700/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Creating account..."
                : "Create account"}

              {!isSubmitting && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-violet-700 transition hover:text-violet-900"
              >
                Sign in
              </Link>
            </p>
          </form>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

              <div>
                <p className="text-sm font-medium text-slate-800">
                  Secure account creation
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Your account is protected with JWT authentication
                  and rotating refresh tokens.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 NexusAI Enterprise. All rights reserved.
          </p>
        </div>
      </section>
    </main>
  );
}