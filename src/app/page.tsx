import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const { userId } = await auth();

  // If user is signed in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
              <span className="text-xl font-bold text-white">
                Unified Dashboard
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
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
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            Stop jumping between 5+ dashboards. Monitor Sentry errors, Vercel
            deployments, Stripe revenue, and more — all in one view. Get alerted
            when something needs attention.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="rounded-xl border border-slate-700 bg-slate-800/50 px-8 py-4 text-lg font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              See How It Works
            </Link>
          </div>

          {/* Social Proof */}
          <p className="mt-8 text-sm text-slate-500">
            Trusted by 500+ SaaS founders • Free tier available
          </p>
        </div>

        {/* Features Section */}
        <section id="features" className="py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              All Your Metrics, One Glance
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              Connect your tools in seconds. No code required.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Cards */}
            {[
              {
                icon: "🔴",
                title: "Sentry Integration",
                description:
                  "Monitor unresolved issues and error spikes in real-time",
              },
              {
                icon: "▲",
                title: "Vercel Monitoring",
                description: "Track deployment health and edge function status",
              },
              {
                icon: "💳",
                title: "Stripe Revenue",
                description:
                  "Watch your MRR, churn, and revenue trends at a glance",
              },
              {
                icon: "📊",
                title: "PostHog Analytics",
                description: "Product analytics and user behavior insights",
              },
              {
                icon: "🔔",
                title: "Smart Alerts",
                description:
                  "Get notified via Telegram or Email when thresholds are crossed",
              },
              {
                icon: "🏢",
                title: "Multi-Workspace",
                description:
                  "Manage multiple projects with isolated dashboards",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition-all hover:border-indigo-500/50 hover:bg-slate-900"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24">
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
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <h3 className="text-lg font-semibold text-slate-400">Free</h3>
              <p className="mt-4 text-4xl font-bold text-white">
                $0<span className="text-lg text-slate-400">/mo</span>
              </p>
              <ul className="mt-8 space-y-3 text-slate-400">
                <li>✓ 1 Integration</li>
                <li>✓ 1 Workspace</li>
                <li>✓ 7-day data retention</li>
                <li>✓ Email alerts</li>
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-lg border border-slate-700 py-3 text-center font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Micro Tier */}
            <div className="relative rounded-2xl border-2 border-indigo-500 bg-slate-900 p-8">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-medium text-white">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-slate-400">Micro</h3>
              <p className="mt-4 text-4xl font-bold text-white">
                $29<span className="text-lg text-slate-400">/mo</span>
              </p>
              <ul className="mt-8 space-y-3 text-slate-400">
                <li>✓ 3 Integrations</li>
                <li>✓ 3 Workspaces</li>
                <li>✓ 30-day data retention</li>
                <li>✓ Telegram + Email alerts</li>
                <li>✓ Priority support</li>
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-lg bg-indigo-600 py-3 text-center font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Start Trial
              </Link>
            </div>

            {/* Founder Tier */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <h3 className="text-lg font-semibold text-slate-400">Founder</h3>
              <p className="mt-4 text-4xl font-bold text-white">
                $79<span className="text-lg text-slate-400">/mo</span>
              </p>
              <ul className="mt-8 space-y-3 text-slate-400">
                <li>✓ Unlimited Integrations</li>
                <li>✓ Unlimited Workspaces</li>
                <li>✓ 90-day data retention</li>
                <li>✓ All alert channels</li>
                <li>✓ Team access</li>
                <li>✓ Weekly email summary</li>
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-lg border border-slate-700 py-3 text-center font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Start Trial
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Unified Dashboard. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
