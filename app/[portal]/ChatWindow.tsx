'use client'

import { useChat } from 'ai/react'
import { useRef, useEffect } from 'react'

interface Props {
  portal: string
  systemPrompt: string
  starterQuestions: string[]
}

export default function ChatWindow({ portal, starterQuestions }: Props) {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: `/api/chat/${portal}`,
  })

  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col flex-1 min-h-0 h-[calc(100vh-57px)]">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {isEmpty && (
            <div className="text-center py-10">
              <p className="text-gray-500 text-sm mb-6">Try one of these to get started:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {starterQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q)
                    }}
                    className="text-left text-sm text-gray-300 border border-gray-700 hover:border-gray-500 rounded-xl px-4 py-3 transition-colors bg-gray-900/50 hover:bg-gray-800/50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                {m.parts ? (
                  m.parts.map((part, i) => {
                    if (part.type === 'text') {
                      return <span key={i}>{part.text}</span>
                    }
                    if (part.type === 'tool-invocation') {
                      const inv = part.toolInvocation
                      return (
                        <div key={i} className="mt-2 rounded-lg border border-gray-600 bg-gray-900 p-3 font-mono text-xs">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-400">⚙</span>
                            <span className="text-yellow-300 font-semibold">{inv.toolName}</span>
                            {inv.state === 'result' && (
                              <span className="ml-auto text-green-400 text-[10px]">✓ done</span>
                            )}
                            {inv.state === 'call' && (
                              <span className="ml-auto text-gray-400 text-[10px] animate-pulse">calling…</span>
                            )}
                          </div>
                          {inv.state === 'call' && (
                            <pre className="text-gray-400 text-[10px] overflow-auto max-h-24">
                              {JSON.stringify(inv.args, null, 2)}
                            </pre>
                          )}
                          {inv.state === 'result' && (
                            <pre className="text-gray-300 text-[10px] overflow-auto max-h-40">
                              {JSON.stringify(inv.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      )
                    }
                    return null
                  })
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <span className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-800 px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask something…"
            disabled={isLoading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
