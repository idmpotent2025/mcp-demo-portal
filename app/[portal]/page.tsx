import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPortal } from '@/lib/portals'
import ChatWindow from './ChatWindow'

interface Props {
  params: Promise<{ portal: string }>
}

export default async function PortalPage({ params }: Props) {
  const { portal: portalSlug } = await params
  const portal = getPortal(portalSlug)

  if (!portal) {
    redirect('/')
  }

  const session = await getSession(portalSlug)
  if (!session) {
    redirect(`/api/auth/login?portal=${portalSlug}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Portal header */}
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="text-gray-400 hover:text-white text-sm">← Portals</a>
          <span className="text-gray-600">|</span>
          <span className="text-xl">{portal.icon}</span>
          <div>
            <span className="text-white font-semibold">{portal.label}</span>
            <span className="ml-2 text-xs text-gray-500 font-mono">/api/mcp/{portal.mcpPath}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{session.email ?? session.sub}</span>
          <a
            href={`/api/auth/logout?portal=${portalSlug}`}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1 rounded-lg transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>

      {/* Chat area */}
      <ChatWindow portal={portalSlug} systemPrompt={portal.systemPrompt} starterQuestions={portal.starterQuestions} />
    </div>
  )
}
