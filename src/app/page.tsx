import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Activity,
  Triangle,
  CreditCard,
  BarChart3,
  Bell,
  Layout,
  Check
} from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();

  // If user is signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-50 bg-slate-950/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-100">
                Unified
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-4 py-1.5 text-sm text-slate-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            One dashboard for all your SaaS vitals
          </div>

          {/* Headline */}
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Your{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Command Center
            </span>{" "}
            for SaaS Health
          </h1>

          {/* Subheadline */}
          <p className="mt-8 max-w-2xl text-lg text-slate-400 leading-relaxed">
            Stop jumping between 5+ dashboards. Monitor Sentry errors, Vercel
            deployments, Stripe revenue, and more — all in one view. Get alerted
            when something needs attention.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:scale-105 transition-all duration-200"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="rounded-xl border border-slate-800 bg-slate-900/50 px-8 py-4 text-lg font-semibold text-white hover:bg-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              See How It Works
            </Link>
          </div>

          {/* Social Proof */}
          <p className="mt-8 text-sm font-medium text-slate-500">
            Trusted by 500+ SaaS founders • No credit card required
          </p>
        </div>

        {/* Features Section */}
        <section id="features" className="py-24 border-t border-slate-800/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              All Your Metrics, One Glance
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Connect your tools in seconds. No code required.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Cards */}
            {[
              {
                icon: Activity,
                title: "Sentry Integration",
                description:
                  "Monitor unresolved issues and error spikes in real-time",
                color: "text-red-400",
                bg: "bg-red-400/10"
              },
              {
                icon: Triangle,
                title: "Vercel Monitoring",
                description: "Track deployment health and edge function status",
                color: "text-white",
                bg: "bg-white/10"
              },
              {
                icon: CreditCard,
                title: "Stripe Revenue",
                description:
                  "Watch your MRR, churn, and revenue trends at a glance",
                color: "text-indigo-400",
                bg: "bg-indigo-400/10"
              },
              {
                icon: BarChart3,
                title: "PostHog Analytics",
                description: "Product analytics and user behavior insights",
                color: "text-amber-400",
                bg: "bg-amber-400/10"
              },
              {
                icon: Bell,
                title: "Smart Alerts",
                description:
                  "Get notified via Telegram or Email when thresholds are crossed",
                color: "text-emerald-400",
                bg: "bg-emerald-400/10"
              },
              {
                icon: Layout,
                title: "Multi-Workspace",
                description:
                  "Manage multiple projects with isolated dashboards",
                color: "text-pink-400",
                bg: "bg-pink-400/10"
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-slate-700 hover:bg-slate-900 hover:shadow-xl"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 border-t border-slate-800/50">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Start free. Upgrade when you grow.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Free Tier */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 hover:border-slate-700 transition-all">
              <h3 className="text-lg font-semibold text-slate-300">Free</h3>
              <p className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-bold tracking-tight">$0</span>
                <span className="ml-1 text-xl text-slate-400">/mo</span>
              </p>
              <ul className="mt-8 space-y-4 text-slate-400">
                {["1 Integration", "1 Workspace", "7-day data retention", "Email alerts"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-indigo-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-lg border border-slate-700 bg-transparent py-3 text-center font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Micro Tier */}
            <div className="relative rounded-2xl border-2 border-indigo-500 bg-slate-900 p-8 shadow-2xl shadow-indigo-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-medium text-white shadow-lg">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-white">Micro</h3>
              <p className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-bold tracking-tight">$29</span>
                <span className="ml-1 text-xl text-slate-400">/mo</span>
              </p>
              <ul className="mt-8 space-y-4 text-slate-300">
                {["3 Integrations", "3 Workspaces", "30-day data retention", "Telegram + Email alerts", "Priority support"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-indigo-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-lg bg-indigo-600 py-3 text-center font-medium text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Founder Tier */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 hover:border-slate-700 transition-all">
              <h3 className="text-lg font-semibold text-slate-300">Founder</h3>
              <p className="mt-4 flex items-baseline text-white">
                <span className="text-4xl font-bold tracking-tight">$79</span>
                <span className="ml-1 text-xl text-slate-400">/mo</span>
              </p>
              <ul className="mt-8 space-y-4 text-slate-400">
                {["Unlimited Integrations", "Unlimited Workspaces", "90-day data retention", "All alert channels", "Team access"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-indigo-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-lg border border-slate-700 bg-transparent py-3 text-center font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Unified Dashboard. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
