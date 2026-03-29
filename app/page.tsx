import Link from 'next/link'
import { Headphones, Mic } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spanish Practice</h1>
          <p className="text-zinc-400 mt-2 text-sm">IB Ab Initio — Oral &amp; Listening</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/listening"
            className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-blue-800/60 bg-blue-950/30 hover:bg-blue-950/60 hover:border-blue-600 active:scale-95 transition-all cursor-pointer shadow-lg shadow-blue-950/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center group-hover:bg-blue-500 transition-colors shadow-md">
              <Headphones className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="font-semibold text-base">Listening</div>
              <div className="text-xs text-zinc-400 mt-0.5">Comprehension exercises</div>
            </div>
            <div className="text-xs text-blue-400 font-medium group-hover:text-blue-300">Start →</div>
          </Link>

          <Link
            href="/oral"
            className="group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-green-800/60 bg-green-950/30 hover:bg-green-950/60 hover:border-green-600 active:scale-95 transition-all cursor-pointer shadow-lg shadow-green-950/20"
          >
            <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center group-hover:bg-green-500 transition-colors shadow-md">
              <Mic className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="font-semibold text-base">Oral</div>
              <div className="text-xs text-zinc-400 mt-0.5">Speak with AI tutor</div>
            </div>
            <div className="text-xs text-green-400 font-medium group-hover:text-green-300">Start →</div>
          </Link>
        </div>

        <p className="text-xs text-zinc-600">
          Powered by Groq · Free to use
        </p>
      </div>
    </main>
  )
}
