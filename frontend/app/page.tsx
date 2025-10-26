'use client'

import { useState } from 'react'
import { api, type RepoAnalysisResult } from '@/lib/api'
import { GitHubIcon } from './icons'

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<RepoAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!repoUrl.trim()) return

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)

    try {
      const result = await api.analyzeGitHubRepo(repoUrl)
      setAnalysis(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze repository')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDeploy = () => {
    if (analysis) {
      // Navigate to deployment config page with repo URL
      window.location.href = `/deploy?repo=${encodeURIComponent(repoUrl)}`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-black dark:to-zinc-900">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-7xl">
            Deploy Your <span className="text-blue-600">AI Agents</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Import your LangChain or LangGraph repository from GitHub and deploy it instantly.
            Vercel-like deployment experience for AI agents.
          </p>

          {/* Import Form */}
          <form onSubmit={handleAnalyze} className="mt-10">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <GitHubIcon className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="block w-full rounded-lg border-0 bg-white py-4 pl-12 pr-4 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-300 placeholder:text-zinc-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-zinc-900 dark:text-white dark:ring-zinc-700 dark:placeholder:text-zinc-500"
                  disabled={isAnalyzing}
                />
              </div>
              <button
                type="submit"
                disabled={isAnalyzing || !repoUrl.trim()}
                className="rounded-lg bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Import'
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && (
            <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {analysis.metadata.githubInfo?.fullName || 'Repository'}
                    </h3>
                    {analysis.readinessStatus === 'ready' && (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Ready
                      </span>
                    )}
                  </div>
                  
                  {analysis.metadata.githubInfo?.description && (
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {analysis.metadata.githubInfo.description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Type:</span>
                      <span className="ml-2 font-medium text-zinc-900 dark:text-white">
                        {analysis.metadata.framework}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Runtime:</span>
                      <span className="ml-2 font-medium text-zinc-900 dark:text-white">
                        {analysis.metadata.runtime || 'Python'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 dark:text-zinc-400">Entry:</span>
                      <span className="ml-2 font-mono text-xs text-zinc-900 dark:text-white">
                        {analysis.entryPoint}
                      </span>
                    </div>
                    {analysis.metadata.githubInfo && (
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">Stars:</span>
                        <span className="ml-2 font-medium text-zinc-900 dark:text-white">
                          {analysis.metadata.githubInfo.stars}
                        </span>
                      </div>
                    )}
                  </div>

                  {analysis.warnings.length > 0 && (
                    <div className="mt-4 rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                        Warnings:
                      </p>
                      <ul className="mt-1 list-disc list-inside text-sm text-yellow-700 dark:text-yellow-500">
                        {analysis.warnings.map((warning, i) => (
                          <li key={i}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {analysis.readinessStatus === 'ready' && (
                <button
                  onClick={handleDeploy}
                  className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Continue to Deploy →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mx-auto mt-32 max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
                Instant Deployment
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Deploy your LangChain/LangGraph agents in seconds
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
                Secure Isolation
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Each agent runs in an isolated Docker container
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/20">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
                Real-time Logs
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                Monitor your agent execution with live logs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
