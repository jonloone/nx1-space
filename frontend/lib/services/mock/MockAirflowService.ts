/**
 * MockAirflowService - Simulates Apache Airflow for workflow orchestration
 * Provides DAG management, task execution, and monitoring
 */

import { mockDataStore, DAG, DAGRun, TaskInstance } from './MockDataStore';

export interface DAGDetail extends DAG {
  description?: string;
  tags: string[];
  maxActiveRuns: number;
  concurrency: number;
  isPaused: boolean;
  fileLocation: string;
  lastParsed: Date;
}

export interface TaskDetail {
  taskId: string;
  dagId: string;
  operator: string;
  dependencies: string[];
  retries: number;
  retryDelay: number;
  timeout: number;
  executorConfig?: any;
  params: Record<string, any>;
}

export interface DAGRunDetail extends DAGRun {
  logUrl?: string;
  notes?: string;
  confOverride?: Record<string, any>;
}

export interface TaskLog {
  taskId: string;
  tryNumber: number;
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
}

export interface DAGStats {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  failureReasons: Record<string, number>;
  taskStats: Record<string, {
    totalRuns: number;
    successRate: number;
    averageDuration: number;
  }>;
}

class MockAirflowService {
  private dags: Map<string, DAGDetail> = new Map();
  private runs: Map<string, DAGRunDetail[]> = new Map();
  private logs: Map<string, TaskLog[]> = new Map();
  private runCounter = 1000;
  
  constructor() {
    this.initializeMockDAGs();
    this.startScheduler();
  }
  
  private initializeMockDAGs() {
    // Convert MockDataStore DAGs to detailed DAGs
    const baseDags = mockDataStore.getAllDAGs();
    
    baseDags.forEach(dag => {
      const detailedDag: DAGDetail = {
        ...dag,
        description: `Orchestrates ${dag.name} workflow`,
        tags: ['production', 'etl', 'critical'],
        maxActiveRuns: 1,
        concurrency: 4,
        isPaused: false,
        fileLocation: `/dags/${dag.id}.py`,
        lastParsed: new Date()
      };
      
      this.dags.set(dag.id, detailedDag);
      
      // Generate some historical runs
      this.generateHistoricalRuns(dag.id);
    });
  }
  
  private generateHistoricalRuns(dagId: string) {
    const runs: DAGRunDetail[] = [];
    const now = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const executionDate = new Date(now - i * 6 * 60 * 60 * 1000); // Every 6 hours
      const startDate = new Date(executionDate.getTime() + 60000); // 1 minute later
      const duration = Math.floor(Math.random() * 7200000) + 1800000; // 30min to 2h
      const isSuccess = Math.random() > 0.2; // 80% success rate
      
      const run: DAGRunDetail = {
        id: `run_${this.runCounter++}`,
        dagId,
        executionDate,
        startDate,
        endDate: new Date(startDate.getTime() + duration),
        state: isSuccess ? 'success' : 'failed',
        tasks: this.generateTaskInstances(dagId, isSuccess),
        logUrl: `/logs/${dagId}/${executionDate.toISOString()}`,
        notes: i === 0 && !isSuccess ? 'Schema validation error detected' : undefined
      };
      
      runs.push(run);
    }
    
    this.runs.set(dagId, runs);
  }
  
  private generateTaskInstances(dagId: string, success: boolean): TaskInstance[] {
    const dag = this.dags.get(dagId);
    if (!dag) return [];
    
    return dag.tasks.map((task, index) => {
      const startOffset = index * 300000; // 5 min between tasks
      const duration = Math.floor(Math.random() * 600000) + 60000; // 1-10 min
      const shouldFail = !success && index === dag.tasks.length - 1; // Last task fails
      
      return {
        taskId: task.id,
        state: shouldFail ? 'failed' : 'success',
        startDate: new Date(Date.now() - 3600000 + startOffset),
        endDate: new Date(Date.now() - 3600000 + startOffset + duration),
        duration,
        tryNumber: shouldFail ? task.retries : 1,
        logs: this.generateTaskLogs(task.id, shouldFail)
      };
    });
  }
  
  private generateTaskLogs(taskId: string, failed: boolean): string[] {
    const logs = [
      `Starting task execution for ${taskId}`,
      'Establishing database connection...',
      'Connection established successfully',
      'Executing transformation logic...'
    ];
    
    if (failed) {
      logs.push(
        'ERROR: Schema validation failed',
        'ERROR: Field customer_email expected VARCHAR(50), got VARCHAR(100)',
        'Task failed with exit code 1'
      );
    } else {
      logs.push(
        'Transformation completed successfully',
        'Writing results to destination...',
        'Task completed successfully'
      );
    }
    
    return logs;
  }
  
  /**
   * Get all DAGs
   */
  async getDAGs(filters?: {
    tags?: string[];
    isPaused?: boolean;
  }): Promise<DAGDetail[]> {
    await this.simulateLatency();
    
    let dags = Array.from(this.dags.values());
    
    if (filters?.tags) {
      dags = dags.filter(dag =>
        filters.tags!.some(tag => dag.tags.includes(tag))
      );
    }
    
    if (filters?.isPaused !== undefined) {
      dags = dags.filter(dag => dag.isPaused === filters.isPaused);
    }
    
    return dags;
  }
  
  /**
   * Get DAG details
   */
  async getDAG(dagId: string): Promise<DAGDetail | null> {
    await this.simulateLatency();
    return this.dags.get(dagId) || null;
  }
  
  /**
   * Get DAG runs
   */
  async getDAGRuns(dagId: string, limit: number = 10): Promise<DAGRunDetail[]> {
    await this.simulateLatency();
    
    const runs = this.runs.get(dagId) || [];
    return runs.slice(0, limit);
  }
  
  /**
   * Get specific DAG run
   */
  async getDAGRun(dagId: string, runId: string): Promise<DAGRunDetail | null> {
    await this.simulateLatency();
    
    const runs = this.runs.get(dagId) || [];
    return runs.find(r => r.id === runId) || null;
  }
  
  /**
   * Trigger a DAG run
   */
  async triggerDAGRun(dagId: string, conf?: Record<string, any>): Promise<DAGRunDetail> {
    await this.simulateLatency();
    
    const dag = this.dags.get(dagId);
    if (!dag) {
      throw new Error(`DAG ${dagId} not found`);
    }
    
    const run: DAGRunDetail = {
      id: `manual_run_${this.runCounter++}`,
      dagId,
      executionDate: new Date(),
      startDate: new Date(),
      state: 'running',
      tasks: dag.tasks.map(task => ({
        taskId: task.id,
        state: 'queued',
        tryNumber: 0
      })),
      confOverride: conf,
      notes: 'Manually triggered'
    };
    
    const existingRuns = this.runs.get(dagId) || [];
    this.runs.set(dagId, [run, ...existingRuns]);
    
    // Simulate run completion after delay
    setTimeout(() => {
      run.state = 'success';
      run.endDate = new Date();
      run.tasks.forEach(task => {
        task.state = 'success';
        task.startDate = new Date();
        task.endDate = new Date();
        task.duration = 60000;
        task.tryNumber = 1;
      });
    }, 5000);
    
    return run;
  }
  
  /**
   * Pause/unpause a DAG
   */
  async setDAGPaused(dagId: string, isPaused: boolean): Promise<void> {
    await this.simulateLatency();
    
    const dag = this.dags.get(dagId);
    if (dag) {
      dag.isPaused = isPaused;
    }
  }
  
  /**
   * Clear task instances for rerun
   */
  async clearTaskInstances(dagId: string, runId: string, taskIds: string[]): Promise<void> {
    await this.simulateLatency();
    
    const runs = this.runs.get(dagId) || [];
    const run = runs.find(r => r.id === runId);
    
    if (run) {
      taskIds.forEach(taskId => {
        const task = run.tasks.find(t => t.taskId === taskId);
        if (task) {
          task.state = 'queued';
          task.startDate = undefined;
          task.endDate = undefined;
          task.duration = undefined;
          task.tryNumber = 0;
        }
      });
      
      // Simulate re-execution
      setTimeout(() => {
        taskIds.forEach(taskId => {
          const task = run.tasks.find(t => t.taskId === taskId);
          if (task) {
            task.state = 'success';
            task.startDate = new Date();
            task.endDate = new Date();
            task.duration = 60000;
            task.tryNumber = 1;
          }
        });
      }, 3000);
    }
  }
  
  /**
   * Get task logs
   */
  async getTaskLogs(dagId: string, runId: string, taskId: string): Promise<string[]> {
    await this.simulateLatency();
    
    const runs = this.runs.get(dagId) || [];
    const run = runs.find(r => r.id === runId);
    const task = run?.tasks.find(t => t.taskId === taskId);
    
    return task?.logs || ['No logs available'];
  }
  
  /**
   * Get DAG statistics
   */
  async getDAGStats(dagId: string): Promise<DAGStats> {
    await this.simulateLatency();
    
    const runs = this.runs.get(dagId) || [];
    const successRuns = runs.filter(r => r.state === 'success').length;
    const totalDuration = runs.reduce((sum, r) => {
      if (r.endDate && r.startDate) {
        return sum + (r.endDate.getTime() - r.startDate.getTime());
      }
      return sum;
    }, 0);
    
    const taskStats: Record<string, any> = {};
    const dag = this.dags.get(dagId);
    
    if (dag) {
      dag.tasks.forEach(task => {
        let successCount = 0;
        let totalTaskDuration = 0;
        let taskRunCount = 0;
        
        runs.forEach(run => {
          const taskInstance = run.tasks.find(t => t.taskId === task.id);
          if (taskInstance) {
            taskRunCount++;
            if (taskInstance.state === 'success') successCount++;
            if (taskInstance.duration) totalTaskDuration += taskInstance.duration;
          }
        });
        
        taskStats[task.id] = {
          totalRuns: taskRunCount,
          successRate: taskRunCount > 0 ? (successCount / taskRunCount) * 100 : 0,
          averageDuration: taskRunCount > 0 ? totalTaskDuration / taskRunCount : 0
        };
      });
    }
    
    return {
      totalRuns: runs.length,
      successRate: runs.length > 0 ? (successRuns / runs.length) * 100 : 0,
      averageDuration: runs.length > 0 ? totalDuration / runs.length : 0,
      failureReasons: {
        'Schema validation': 2,
        'Connection timeout': 1,
        'Resource limit': 1
      },
      taskStats
    };
  }
  
  /**
   * Get upcoming runs
   */
  async getUpcomingRuns(): Promise<Array<{
    dagId: string;
    nextRun: Date;
    schedule: string;
  }>> {
    await this.simulateLatency();
    
    return Array.from(this.dags.values())
      .filter(dag => !dag.isPaused)
      .map(dag => ({
        dagId: dag.id,
        nextRun: dag.nextRun,
        schedule: dag.schedule
      }))
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());
  }
  
  /**
   * Start mock scheduler
   */
  private startScheduler() {
    // Simulate scheduled runs every minute
    setInterval(() => {
      this.dags.forEach((dag, dagId) => {
        if (!dag.isPaused && Math.random() > 0.95) { // 5% chance per minute
          const run: DAGRunDetail = {
            id: `scheduled_run_${this.runCounter++}`,
            dagId,
            executionDate: new Date(),
            startDate: new Date(),
            state: 'running',
            tasks: dag.tasks.map(task => ({
              taskId: task.id,
              state: 'queued',
              tryNumber: 0
            }))
          };
          
          const existingRuns = this.runs.get(dagId) || [];
          this.runs.set(dagId, [run, ...existingRuns].slice(0, 50)); // Keep last 50 runs
          
          // Update next run time
          dag.nextRun = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours later
        }
      });
    }, 60000); // Check every minute
  }
  
  private async simulateLatency() {
    return new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  }
}

export const mockAirflowService = new MockAirflowService();