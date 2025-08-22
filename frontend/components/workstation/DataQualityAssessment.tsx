'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DataQualityAssessmentProps {
  datasetUrn?: string;
  tableName?: string;
  onClose?: () => void;
}

export function DataQualityAssessment({ datasetUrn, tableName = 'customers', onClose }: DataQualityAssessmentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dbt-tests' | 'datahub-profile' | 'history'>('overview');
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState(new Date().toISOString());
  
  // Mock data reflecting actual dbt + DataHub integration
  const qualityData = {
    overview: {
      overallScore: 87,
      trend: 'improving',
      lastAssessment: '2 hours ago',
      nextScheduled: 'in 4 hours'
    },
    datahubProfile: {
      completeness: { score: 94, nullCount: 4520, nullPercentage: 0.36 },
      uniqueness: { score: 98, distinctCount: 1245000, duplicates: 3420 },
      freshness: { score: 100, lastUpdate: '15 minutes ago', sla: '1 hour' },
      volume: { rowCount: 1250000, sizeGB: 2.4, dailyGrowth: '+2.3%' },
      schema: { columnCount: 45, lastChange: '3 days ago' }
    },
    dbtTests: {
      summary: { passed: 23, failed: 2, warned: 3, skipped: 0 },
      failedTests: [
        {
          name: 'unique_customer_id',
          type: 'uniqueness',
          severity: 'error',
          message: '3,420 duplicate customer IDs found',
          sql: 'SELECT customer_id FROM analytics.customers GROUP BY customer_id HAVING COUNT(*) > 1'
        },
        {
          name: 'valid_phone_format',
          type: 'validity',
          severity: 'error',
          message: '156 records with invalid phone format',
          sql: "SELECT * FROM analytics.customers WHERE phone NOT ~ '^\\+?[1-9]\\d{1,14}$'"
        }
      ],
      warnedTests: [
        {
          name: 'expected_order_volume',
          type: 'consistency',
          severity: 'warning',
          message: 'Order volume 15% below expected range'
        },
        {
          name: 'email_deliverability',
          type: 'validity',
          severity: 'warning',
          message: '2.3% emails marked as undeliverable'
        },
        {
          name: 'address_completeness',
          type: 'completeness',
          severity: 'warning',
          message: '8% of addresses missing postal codes'
        }
      ],
      passedTests: [
        'not_null_customer_id',
        'not_null_created_at',
        'relationships_customer_orders',
        'accepted_values_status',
        'unique_email',
        'valid_date_ranges',
        'positive_order_amounts'
      ]
    },
    history: [
      { date: '2024-11-22', score: 87, tests: { passed: 23, failed: 2 } },
      { date: '2024-11-21', score: 85, tests: { passed: 22, failed: 3 } },
      { date: '2024-11-20', score: 82, tests: { passed: 21, failed: 4 } },
      { date: '2024-11-19', score: 79, tests: { passed: 20, failed: 5 } },
      { date: '2024-11-18', score: 83, tests: { passed: 22, failed: 3 } }
    ]
  };

  const runDbtTests = () => {
    setIsRunning(true);
    // Simulate dbt test execution
    setTimeout(() => {
      setIsRunning(false);
      setLastRun(new Date().toISOString());
    }, 3000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return 'fas fa-times-circle text-red-400';
      case 'warning': return 'fas fa-exclamation-triangle text-yellow-400';
      case 'info': return 'fas fa-info-circle text-blue-400';
      default: return 'fas fa-check-circle text-green-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl glass-panel rounded-2xl p-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif-display text-gray-100">Data Quality Assessment</h1>
            <p className="text-sm text-gray-500 mt-1 font-sans-ui">
              Powered by dbt tests + DataHub profiling for <span className="text-blue-400">{tableName}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={runDbtTests}
              disabled={isRunning}
              className="px-4 py-2 glass-button rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  <span className="font-sans-ui">Running dbt tests...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-play" />
                  <span className="font-sans-ui">Run dbt Tests</span>
                </>
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <i className="fas fa-times text-xl" />
              </button>
            )}
          </div>
        </div>

        {/* Quality Score Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 glass-panel rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-sans-ui">Overall Score</span>
              <i className="fas fa-chart-line text-gray-600" />
            </div>
            <div className={cn("text-3xl font-bold", getScoreColor(qualityData.overview.overallScore))}>
              {qualityData.overview.overallScore}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <i className="fas fa-arrow-up text-green-400 mr-1" />
              {qualityData.overview.trend}
            </div>
          </div>

          <div className="p-4 glass-panel rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-sans-ui">dbt Tests</span>
              <img src="/dbt-logo.svg" alt="dbt" className="h-4 opacity-50" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-green-400">
                <span className="text-2xl font-bold">{qualityData.dbtTests.summary.passed}</span>
                <span className="text-xs ml-1">pass</span>
              </div>
              <div className="text-red-400">
                <span className="text-2xl font-bold">{qualityData.dbtTests.summary.failed}</span>
                <span className="text-xs ml-1">fail</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">{qualityData.dbtTests.summary.warned} warnings</div>
          </div>

          <div className="p-4 glass-panel rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-sans-ui">DataHub Profile</span>
              <img src="/datahub-logo.svg" alt="DataHub" className="h-4 opacity-50" />
            </div>
            <div className="text-2xl font-bold text-gray-200">
              {(qualityData.datahubProfile.volume.rowCount / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-gray-500 mt-1">
              rows • {qualityData.datahubProfile.volume.sizeGB}GB
            </div>
          </div>

          <div className="p-4 glass-panel rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-sans-ui">Freshness</span>
              <i className="fas fa-clock text-gray-600" />
            </div>
            <div className="text-sm text-gray-200">
              {qualityData.datahubProfile.freshness.lastUpdate}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              SLA: {qualityData.datahubProfile.freshness.sla}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg transition-all font-sans-ui",
              activeTab === 'overview' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('dbt-tests')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg transition-all font-sans-ui flex items-center justify-center gap-2",
              activeTab === 'dbt-tests' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <i className="fas fa-vial" />
            dbt Tests
            {qualityData.dbtTests.summary.failed > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                {qualityData.dbtTests.summary.failed}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('datahub-profile')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg transition-all font-sans-ui flex items-center justify-center gap-2",
              activeTab === 'datahub-profile' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <i className="fas fa-chart-bar" />
            DataHub Profile
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg transition-all font-sans-ui",
              activeTab === 'history' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
            )}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quality Dimensions */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-serif-display text-gray-200">DataHub Profiling Metrics</h3>
                  <div className="space-y-3">
                    <QualityMetric
                      label="Completeness"
                      value={qualityData.datahubProfile.completeness.score}
                      detail={`${qualityData.datahubProfile.completeness.nullPercentage}% nulls`}
                      source="DataHub"
                    />
                    <QualityMetric
                      label="Uniqueness"
                      value={qualityData.datahubProfile.uniqueness.score}
                      detail={`${qualityData.datahubProfile.uniqueness.duplicates.toLocaleString()} duplicates`}
                      source="DataHub"
                    />
                    <QualityMetric
                      label="Freshness"
                      value={qualityData.datahubProfile.freshness.score}
                      detail={qualityData.datahubProfile.freshness.lastUpdate}
                      source="DataHub"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-serif-display text-gray-200">dbt Test Results</h3>
                  <div className="space-y-3">
                    <QualityMetric
                      label="Validity"
                      value={88}
                      detail="Business rules validation"
                      source="dbt"
                    />
                    <QualityMetric
                      label="Consistency"
                      value={92}
                      detail="Referential integrity"
                      source="dbt"
                    />
                    <QualityMetric
                      label="Accuracy"
                      value={85}
                      detail="Custom assertions"
                      source="dbt"
                    />
                  </div>
                </div>
              </div>

              {/* Current Issues */}
              <div>
                <h3 className="text-lg font-serif-display text-gray-200 mb-4">Active Issues</h3>
                <div className="space-y-2">
                  {qualityData.dbtTests.failedTests.map((test, idx) => (
                    <div key={idx} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className={getSeverityIcon(test.severity)} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans-ui font-medium text-gray-200">{test.name}</span>
                            <span className="px-2 py-0.5 bg-gray-800 text-xs text-gray-400 rounded">dbt test</span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{test.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {qualityData.dbtTests.warnedTests.map((test, idx) => (
                    <div key={idx} className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <i className={getSeverityIcon(test.severity)} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans-ui font-medium text-gray-200">{test.name}</span>
                            <span className="px-2 py-0.5 bg-gray-800 text-xs text-gray-400 rounded">dbt test</span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{test.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dbt-tests' && (
            <div className="space-y-6">
              {/* Test Results Summary */}
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-serif-display text-gray-200">dbt Test Execution</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <i className="fas fa-terminal" />
                    <code>dbt test --select {tableName}</code>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">{qualityData.dbtTests.summary.passed}</div>
                    <div className="text-xs text-gray-500">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">{qualityData.dbtTests.summary.failed}</div>
                    <div className="text-xs text-gray-500">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">{qualityData.dbtTests.summary.warned}</div>
                    <div className="text-xs text-gray-500">Warnings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-500">{qualityData.dbtTests.summary.skipped}</div>
                    <div className="text-xs text-gray-500">Skipped</div>
                  </div>
                </div>
              </div>

              {/* Failed Tests Detail */}
              {qualityData.dbtTests.failedTests.length > 0 && (
                <div>
                  <h3 className="text-lg font-serif-display text-gray-200 mb-3">Failed Tests</h3>
                  <div className="space-y-3">
                    {qualityData.dbtTests.failedTests.map((test, idx) => (
                      <div key={idx} className="p-4 glass-panel border-l-4 border-red-500 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-sans-ui font-medium text-gray-200">{test.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">{test.message}</p>
                            {test.sql && (
                              <div className="mt-3 p-2 bg-gray-900/50 rounded">
                                <code className="text-xs text-gray-500 font-mono">{test.sql}</code>
                              </div>
                            )}
                          </div>
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                            {test.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passed Tests */}
              <div>
                <h3 className="text-lg font-serif-display text-gray-200 mb-3">Passed Tests</h3>
                <div className="grid grid-cols-3 gap-2">
                  {qualityData.dbtTests.passedTests.map((test, idx) => (
                    <div key={idx} className="p-2 bg-green-500/10 rounded-lg flex items-center gap-2">
                      <i className="fas fa-check-circle text-green-400 text-sm" />
                      <span className="text-sm text-gray-300 font-sans-ui">{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'datahub-profile' && (
            <div className="space-y-6">
              {/* DataHub Profile Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 glass-panel rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-sans-ui text-gray-300">Dataset Volume</h4>
                    <i className="fas fa-database text-blue-400" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rows</span>
                      <span className="text-gray-300">{qualityData.datahubProfile.volume.rowCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size</span>
                      <span className="text-gray-300">{qualityData.datahubProfile.volume.sizeGB} GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Columns</span>
                      <span className="text-gray-300">{qualityData.datahubProfile.schema.columnCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Daily Growth</span>
                      <span className="text-green-400">{qualityData.datahubProfile.volume.dailyGrowth}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 glass-panel rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-sans-ui text-gray-300">Data Quality</h4>
                    <i className="fas fa-chart-line text-green-400" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Null %</span>
                      <span className="text-gray-300">{qualityData.datahubProfile.completeness.nullPercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duplicates</span>
                      <span className="text-gray-300">{qualityData.datahubProfile.uniqueness.duplicates.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Distinct</span>
                      <span className="text-gray-300">{(qualityData.datahubProfile.uniqueness.distinctCount / 1000).toFixed(0)}K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Schema Change</span>
                      <span className="text-gray-300">{qualityData.datahubProfile.schema.lastChange}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 glass-panel rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-sans-ui text-gray-300">Monitoring</h4>
                    <i className="fas fa-bell text-orange-400" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Update</span>
                      <span className="text-gray-300">{qualityData.datahubProfile.freshness.lastUpdate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">SLA</span>
                      <span className="text-gray-300">{qualityData.datahubProfile.freshness.sla}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Check</span>
                      <span className="text-gray-300">{qualityData.overview.nextScheduled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className="text-green-400">Healthy</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Links to DataHub */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-sans-ui font-medium text-gray-200">View Full Profile in DataHub</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Access detailed profiling, lineage, and documentation
                    </p>
                  </div>
                  <a
                    href={`https://datahub.company.com/dataset/${datasetUrn || 'urn:li:dataset:customers'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 glass-button rounded-lg flex items-center gap-2"
                  >
                    <i className="fas fa-external-link-alt" />
                    <span className="font-sans-ui">Open in DataHub</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <h3 className="text-lg font-serif-display text-gray-200 mb-4">Quality Trend (Last 5 Days)</h3>
                <div className="space-y-3">
                  {qualityData.history.map((day, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-24">{day.date}</span>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              day.score >= 85 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                              day.score >= 70 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                              "bg-gradient-to-r from-red-500 to-pink-500"
                            )}
                            style={{ width: `${day.score}%` }}
                          />
                        </div>
                      </div>
                      <span className={cn("text-sm font-bold w-12 text-right", getScoreColor(day.score))}>
                        {day.score}%
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400">{day.tests.passed}</span>
                        <span className="text-gray-600">/</span>
                        <span className="text-red-400">{day.tests.failed}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quality Metric Component
function QualityMetric({ label, value, detail, source }: {
  label: string;
  value: number;
  detail: string;
  source: 'dbt' | 'DataHub';
}) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-500';
    if (score >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-sans-ui">{label}</span>
          <span className="px-2 py-0.5 bg-gray-800 text-xs text-gray-500 rounded">
            {source}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{detail}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn("h-full bg-gradient-to-r", getScoreColor(value))}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className={cn(
          "text-sm font-bold w-12 text-right",
          value >= 90 ? 'text-green-400' :
          value >= 70 ? 'text-yellow-400' :
          'text-red-400'
        )}>
          {value}%
        </span>
      </div>
    </div>
  );
}