'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, type ExecutionResult } from '@/lib/api'

function DeployContent() {
  const searchParams = useSearchParams()
  const repoUrl = searchParams.get('repo') || ''

  const [envVars, setEnvVars] = useState<Record<string, string>>({
    GOOGLE_API_KEY: '',
    TAVILY_API_KEY: '',
    OPENAI_API_KEY: '',
  })
  const [isDeploying, setIsDeploying] = useState(false)
  const [execution, setExecution] = useState<ExecutionResult | null>(null)
  const [logs, setLogs] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Poll for execution updates
  useEffect(() => {
    if (!execution?.executionId) return

    const interval = setInterval(async () => {
      try {
        const [statusRes, logsRes] = await Promise.all([
          api.getExecutionStatus(execution.executionId),
          api.getExecutionLogs(execution.executionId),
        ])

        setExecution(statusRes.data)
        setLogs(logsRes.data.logs)

        // Stop polling if finished
        if (['success', 'failed', 'timeout'].includes(statusRes.data.status)) {
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [execution?.executionId])

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDeploying(true)
    setError(null)

    try {
      // Filter out empty env vars
      const filteredEnvVars = Object.fromEntries(
        Object.entries(envVars).filter(([, value]) => value.trim() !== '')
      )

      const result = await api.executeAgent({
        repoUrl,
        environmentVars: filteredEnvVars,
        tier: 'free',
      })

      setExecution(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start deployment')
      setIsDeploying(false)
    }
  }

  const handleCancel = async () => {
    if (!execution?.executionId) return

    try {
      await api.cancelExecution(execution.executionId)
      setExecution({ ...execution, status: 'failed', error: 'Cancelled by user' })
    } catch (err) {
      console.error('Cancel error:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'failed':
      case 'timeout':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'running':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      default:
        return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-900/20'
    }
  }

  if (execution) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-12">
        <div className="mx-auto max-w-5xl px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Deployment
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {repoUrl}
            </p>
          </div>

          {/* Status Card */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                    execution.status
                  )}`}
                >
                  {execution.status === 'running' && (
                    <svg className="mr-1.5 h-3 w-3 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {execution.status}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Started {new Date(execution.startTime).toLocaleTimeString()}
                </span>
              </div>

              {execution.status === 'running' && (
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              )}
            </div>

            {execution.error && (
              <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-400">{execution.error}</p>
              </div>
            )}

            {execution.exitCode !== undefined && (
              <div className="mt-4 text-sm">
                <span className="text-zinc-500 dark:text-zinc-400">Exit Code:</span>
                <span className="ml-2 font-mono text-zinc-900 dark:text-white">
                  {execution.exitCode}
                </span>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Execution Logs
              </h2>
            </div>
            <div className="p-4">
              <pre className="max-h-96 overflow-auto rounded-md bg-zinc-900 p-4 text-xs text-zinc-100 dark:bg-black">
                {logs || 'Waiting for logs...'}
              </pre>
            </div>
          </div>

          {execution.status === 'success' && (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-400">
                🎉 Deployment Successful!
              </h3>
              <p className="mt-2 text-sm text-green-700 dark:text-green-500">
                Your agent has completed execution. Check the logs above for results.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Configure Deployment
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {repoUrl}
          </p>
        </div>

        <form onSubmit={handleDeploy} className="space-y-6">
          {/* Environment Variables */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Environment Variables
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Add API keys required by your agent
            </p>

            <div className="mt-6 space-y-4">
              {Object.keys(envVars).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {key}
                  </label>
                  <input
                    type="password"
                    value={envVars[key]}
                    onChange={(e) =>
                      setEnvVars({ ...envVars, [key]: e.target.value })
                    }
                    placeholder="sk-..."
                    className="mt-1 block w-full rounded-md border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isDeploying}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeploying ? 'Starting Deployment...' : 'Deploy Agent'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function DeployPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <DeployContent />
    </Suspense>
  )
}
