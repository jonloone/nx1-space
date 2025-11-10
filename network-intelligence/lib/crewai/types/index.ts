/**
 * CrewAI-Inspired Multi-Agent Orchestration Types
 *
 * Built on Vercel AI SDK for native TypeScript integration
 */

import { CoreTool, generateText } from 'ai'

/**
 * Agent Role and Configuration
 */
export interface AgentConfig {
  name: string
  role: string
  goal: string
  backstory: string
  tools: AgentTool[]
  llmModel?: string // defaults to project LLM
  temperature?: number
  maxTokens?: number
  verbose?: boolean
}

/**
 * Agent Tool - Wraps service functions for agent use
 */
export interface AgentTool {
  name: string
  description: string
  parameters: Record<string, any> // JSON schema for parameters
  execute: (params: any) => Promise<any>
}

/**
 * Task Definition
 */
export interface Task {
  id: string
  description: string
  expectedOutput: string
  agent: Agent
  context?: Task[] // Tasks this depends on (for sequential execution)
  asyncExecution?: boolean // Can run in parallel
}

/**
 * Task Result
 */
export interface TaskResult {
  taskId: string
  output: any
  raw: string // Raw LLM output
  tokensUsed?: number
  duration?: number
  success: boolean
  error?: string
}

/**
 * Crew Configuration
 */
export interface CrewConfig {
  name: string
  agents: Agent[]
  tasks: Task[]
  process?: ProcessType
  verbose?: boolean
  memory?: boolean // Enable cross-task memory
}

/**
 * Process Types
 */
export enum ProcessType {
  SEQUENTIAL = 'sequential', // Execute tasks one after another
  PARALLEL = 'parallel', // Execute all tasks simultaneously
  HIERARCHICAL = 'hierarchical' // Manager agent delegates to specialists
}

/**
 * Crew Execution Result
 */
export interface CrewResult {
  output: string // Final synthesized output
  taskResults: TaskResult[]
  totalTokens?: number
  totalDuration?: number
  success: boolean
}

/**
 * Agent Class
 */
export class Agent {
  constructor(public config: AgentConfig) {}

  /**
   * Execute agent with given task
   */
  async execute(task: Task, context?: Record<string, any>): Promise<TaskResult> {
    const startTime = Date.now()

    try {
      // Build prompt with agent role, task, and available tools
      const prompt = this.buildPrompt(task, context)

      // Convert agent tools to Vercel AI SDK format
      const tools = this.convertTools()

      // Execute with LLM
      const result = await generateText({
        model: this.getModel(),
        prompt,
        tools,
        temperature: this.config.temperature ?? 0.3,
        maxTokens: this.config.maxTokens ?? 2000,
      })

      if (this.config.verbose) {
        console.log(`🤖 Agent ${this.config.name}: ${result.text.substring(0, 200)}...`)
      }

      return {
        taskId: task.id,
        output: this.parseOutput(result.text),
        raw: result.text,
        tokensUsed: result.usage?.totalTokens,
        duration: Date.now() - startTime,
        success: true
      }
    } catch (error) {
      console.error(`❌ Agent ${this.config.name} failed:`, error)
      return {
        taskId: task.id,
        output: null,
        raw: '',
        duration: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Build prompt for agent execution
   */
  private buildPrompt(task: Task, context?: Record<string, any>): string {
    let prompt = `You are ${this.config.role}.

ROLE: ${this.config.role}
GOAL: ${this.config.goal}
BACKSTORY: ${this.config.backstory}

TASK: ${task.description}

EXPECTED OUTPUT: ${task.expectedOutput}
`

    if (context) {
      prompt += `\n\nCONTEXT:\n${JSON.stringify(context, null, 2)}`
    }

    if (this.config.tools.length > 0) {
      prompt += `\n\nAVAILABLE TOOLS:\n${this.config.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}`
    }

    prompt += `\n\nProvide your analysis and use tools as needed to complete the task.`

    return prompt
  }

  /**
   * Convert AgentTool[] to Vercel AI SDK CoreTool format
   */
  private convertTools(): Record<string, CoreTool> {
    const tools: Record<string, CoreTool> = {}

    for (const tool of this.config.tools) {
      tools[tool.name] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: tool.execute
      }
    }

    return tools
  }

  /**
   * Get LLM model for this agent
   */
  private getModel(): any {
    // This will be configured per project
    // For now, return a placeholder that will be replaced
    return this.config.llmModel || 'default-model'
  }

  /**
   * Parse agent output (extract structured data if needed)
   */
  private parseOutput(text: string): any {
    // Try to extract JSON if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1])
      } catch {
        // Fall through to return raw text
      }
    }

    return text
  }
}

/**
 * Crew Class - Orchestrates multiple agents
 */
export class Crew {
  private memory: Record<string, any> = {}

  constructor(public config: CrewConfig) {}

  /**
   * Execute crew workflow
   */
  async kickoff(inputs: Record<string, any> = {}): Promise<CrewResult> {
    const startTime = Date.now()
    const taskResults: TaskResult[] = []

    try {
      console.log(`🚀 Crew "${this.config.name}" starting with ${this.config.tasks.length} tasks...`)

      // Store inputs in memory
      this.memory = { ...inputs }

      // Execute based on process type
      switch (this.config.process) {
        case ProcessType.PARALLEL:
          taskResults.push(...await this.executeParallel())
          break
        case ProcessType.HIERARCHICAL:
          taskResults.push(...await this.executeHierarchical())
          break
        case ProcessType.SEQUENTIAL:
        default:
          taskResults.push(...await this.executeSequential())
      }

      // Synthesize final output
      const output = this.synthesizeOutput(taskResults)

      const totalTokens = taskResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0)
      const totalDuration = Date.now() - startTime

      console.log(`✅ Crew "${this.config.name}" complete (${totalDuration}ms, ${totalTokens} tokens)`)

      return {
        output,
        taskResults,
        totalTokens,
        totalDuration,
        success: taskResults.every(r => r.success)
      }
    } catch (error) {
      console.error(`❌ Crew "${this.config.name}" failed:`, error)
      return {
        output: '',
        taskResults,
        totalDuration: Date.now() - startTime,
        success: false
      }
    }
  }

  /**
   * Execute tasks sequentially
   */
  private async executeSequential(): Promise<TaskResult[]> {
    const results: TaskResult[] = []

    for (const task of this.config.tasks) {
      // Build context from previous task results
      const context = this.buildContext(task, results)

      // Execute task
      const result = await task.agent.execute(task, context)
      results.push(result)

      // Store result in memory
      if (this.config.memory) {
        this.memory[task.id] = result.output
      }

      // Stop if task failed
      if (!result.success) {
        console.error(`⚠️ Task ${task.id} failed, stopping sequential execution`)
        break
      }
    }

    return results
  }

  /**
   * Execute tasks in parallel
   */
  private async executeParallel(): Promise<TaskResult[]> {
    const promises = this.config.tasks.map(task => {
      const context = this.buildContext(task, [])
      return task.agent.execute(task, context)
    })

    return await Promise.all(promises)
  }

  /**
   * Execute with hierarchical process (manager delegates)
   */
  private async executeHierarchical(): Promise<TaskResult[]> {
    // Simplified: Use first agent as manager, others as specialists
    // Manager agent will coordinate via tool calls
    const managerAgent = this.config.agents[0]
    const managerTask = this.config.tasks[0]

    // Execute manager task (manager will use tools to delegate)
    const result = await managerAgent.execute(managerTask, this.memory)

    return [result]
  }

  /**
   * Build context for task from previous results
   */
  private buildContext(task: Task, previousResults: TaskResult[]): Record<string, any> {
    const context = { ...this.memory }

    // Add results from context tasks
    if (task.context) {
      for (const contextTask of task.context) {
        const result = previousResults.find(r => r.taskId === contextTask.id)
        if (result) {
          context[contextTask.id] = result.output
        }
      }
    }

    return context
  }

  /**
   * Synthesize final output from all task results
   */
  private synthesizeOutput(results: TaskResult[]): string {
    // Get the last task result as primary output
    const lastResult = results[results.length - 1]

    if (!lastResult || !lastResult.success) {
      return 'Crew execution failed to produce output'
    }

    return typeof lastResult.output === 'string'
      ? lastResult.output
      : JSON.stringify(lastResult.output, null, 2)
  }
}
