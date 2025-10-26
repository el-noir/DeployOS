const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface RepoAnalysisResult {
  projectType: string
  readinessStatus: string
  detectedFiles: string[]
  entryPoint: string
  dependencies: Record<string, string>
  warnings: string[]
  metadata: {
    hasAiLibraries: boolean
    framework: string
    runtime?: string
    githubInfo?: {
      fullName: string
      description: string | null
      stars: number
      forks: number
      language: string
      topics: string[]
      url: string
    }
  }
}

export interface ExecutionResult {
  executionId: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'timeout'
  startTime: string
  endTime?: string
  logs: string
  exitCode?: number
  error?: string
  containerId?: string
}

export interface ApiResponse<T> {
  statusCode: number
  message: string
  data: T
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_URL
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async analyzeGitHubRepo(repoUrl: string): Promise<ApiResponse<RepoAnalysisResult>> {
    return this.request<RepoAnalysisResult>('/api/repo/analyze-url', {
      method: 'POST',
      body: JSON.stringify({ repoUrl }),
    })
  }

  async analyzeLocalRepo(repoPath: string): Promise<ApiResponse<RepoAnalysisResult>> {
    return this.request<RepoAnalysisResult>('/api/repo/analyze-local', {
      method: 'POST',
      body: JSON.stringify({ repoPath }),
    })
  }

  async executeAgent(params: {
    repoPath?: string
    repoId?: string
    repoUrl?: string
    environmentVars: Record<string, string>
    tier?: 'free' | 'premium'
  }): Promise<ApiResponse<ExecutionResult>> {
    return this.request<ExecutionResult>('/api/agent/execute', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getExecutionStatus(executionId: string): Promise<ApiResponse<ExecutionResult>> {
    return this.request<ExecutionResult>(`/api/agent/${executionId}/status`)
  }

  async getExecutionLogs(executionId: string): Promise<ApiResponse<{ logs: string }>> {
    return this.request<{ logs: string }>(`/api/agent/${executionId}/logs`)
  }

  async cancelExecution(executionId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/agent/${executionId}/cancel`, {
      method: 'POST',
    })
  }

  async checkHealth(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`)
    return response.json()
  }
}

export const api = new ApiClient()
