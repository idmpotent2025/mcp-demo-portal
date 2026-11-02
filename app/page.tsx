import Link from 'next/link'
import { ALL_PORTALS } from '@/lib/portals'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h1 className="text-lg font-semibold text-white">MCP Demo Portal</h1>
            <p className="text-xs text-gray-400">Auth0 CIAM patterns via Model Context Protocol</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto w-full px-6 pt-14 pb-10 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Four portals. Four auth stories.
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Each portal logs in with its own Auth0 Application, showing custom branding via Page Templates.
          Every chat window is wired to a dedicated MCP server endpoint that demonstrates a distinct
          Auth0 CIAM pattern.
        </p>
      </section>

      {/* Portal cards */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-16 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {ALL_PORTALS.map((portal) => (
          <Link
            key={portal.slug}
            href={`/api/auth/${portal.slug}/login`}
            className={`
              group relative flex flex-col gap-3 rounded-2xl border bg-gradient-to-br p-6
              transition-all duration-200 cursor-pointer
              ${portal.cardBg} ${portal.accent}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{portal.icon}</span>
              <div>
                <h3 className="text-xl font-semibold text-white group-hover:text-white">
                  {portal.label}
                </h3>
                <span className="text-xs text-gray-400 font-mono">/api/mcp/{portal.mcpPath}</span>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">{portal.description}</p>

            <div className="mt-auto pt-2 border-t border-white/10">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                Starter questions
              </p>
              <ul className="space-y-1">
                {portal.starterQuestions.slice(0, 2).map((q) => (
                  <li key={q} className="text-xs text-gray-400 truncate">
                    &rsaquo; {q}
                  </li>
                ))}
              </ul>
            </div>

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded-full">
                Sign in →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Auth patterns legend */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-16">
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-4">
            Auth0 patterns demonstrated
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-400">
            {[
              ['JWT Bearer', 'Standard API access token validation'],
              ['FGA', 'Fine-grained authorization checks on resources'],
              ['CIBA Push', 'Out-of-band device push approval flow'],
              ['Token Vault', 'Exchange token for vaulted 3rd-party credential'],
              ['RFC 8693 OBO', 'On-behalf-of audience token exchange'],
              ['Multi-client Branding', 'Per-portal Page Template via distinct Client IDs'],
            ].map(([name, desc]) => (
              <div key={name} className="flex flex-col gap-1">
                <span className="font-medium text-gray-200">{name}</span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
