import { ZodError } from "zod"

export class AnalysisDomainError extends Error {
  get code() { return this._code }
  details?: Record<string, unknown>

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this._code = code
    this.details = details
    this.name = "AnalysisDomainError"
  }
}

function generateRequestId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6)
  const randomId = Math.random().toString(36).substring(2, 8)
  return `req_${timestamp}_${random}_${randomId}`
}

function generateLastSyncRequestId(clientId: string): string {
  const timestamp = Date.now()
  return `lastSync_${clientId}_${timestamp}`
}

export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
export type OptimizationStatus = "not_started" | "in_progress" | "completed" | "failed"
export type ConfidenceLevel = "low" | "medium" | "high"

export interface ExpectedImpact {
  metricType: "performance" | "reliability" | "security" | "compliance" | "scalability"
  metricName: string
  currentValue: number
  targetValue: number
  expectedImprovement: number
  improvementPercentage: number
  improvementUnit: string
  timeHorizonDays: number
}

export interface OptimizationArea {
  areaId: string
  name: string
  description: string
  status: OptimizationStatus
  priority: PriorityLevel
  confidence: ConfidenceLevel
  expectedImpacts: ExpectedImpact[]
  estimatedEffortHours: number
  estimatedEffortDays: number
  estimatedCost: number
  startDate?: Date
  completedDate?: Date
  percentageComplete: number
  requestId?: string
  lastSyncRequestId?: string
  tags: string[]
}

export interface OptimizationRequest {
  requestId?: string
  lastSyncRequestId?: string
  limit?: number
  showPartialOnTimeout?: boolean
}

export interface OptimizationResponse {
  optimizationAreas: OptimizationArea[]
  requestId: string
  lastSyncRequestId?: string
  summary: {
    totalAreas: number
    criticalAreas: number
    highPriorityAreas: number
    mediumPriorityAreas: number
    lowPriorityAreas: number
    totalEstimatedEffort: number
    totalEstimatedCost: number
    averageConfidence: ConfidenceLevel
  }
}

function isInsufficientData(areas: OptimizationArea[]): boolean {
  const nonCompletedAreas = areas.filter(a => a.status !== "completed").length
  const validAreas = areas.filter(a => a.status !== "not_started" && a.confidence !== "low")

  if (nonCompletedAreas === 0) return false
  if (validAreas.length < 1) return true

  return false
}

function calculatePriorityScore(impact: number, effort: number): number {
  const impactWeight = 0.6
  const effortWeight = 0.4
  const normalizedImpact = impact / 100
  const normalizedEffort = 1 - (effort / 100)
  return (normalizedImpact * impactWeight) + (normalizedEffort * effortWeight)
}

function determinePriorityLevel(score: number): PriorityLevel {
  if (score >= 0.75) return "CRITICAL"
  if (score >= 0.50) return "HIGH"
  if (score >= 0.25) return "MEDIUM"
  return "LOW"
}

function determineConfidenceLevel(impactDataCount: number): ConfidenceLevel {
  if (impactDataCount >= 3) return "high"
  if (impactDataCount >= 2) return "medium"
  return "low"
}

async function checkRbac(clientId: string, userRole: string): Promise<boolean> {
  const client = { id: clientId, name: 'Test Client', currentUserId: clientId }
  const clientIdMatch = client.id === clientId || client.clientId === clientId
  const roleMatch = userRole === "owner" || userRole === "strategy" || userRole === "analyst"
  return clientIdMatch && roleMatch
}

async function validateDataAvailability(clientId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10))

  if (!clientId) {
    throw new AnalysisDomainError(
      "insufficient_data_for_priority",
      "No gap report data available for optimization analysis",
      { clientId }
    )
  }
}

async function validateTimestampConstraint(
  requestTime: number,
  timeConstraint: number
): Promise<void> {
  const timeDifference = requestTime - timeConstraint

  if (timeDifference > timeConstraint) {
    throw new AnalysisDomainError(
      "timed_out",
      "Analysis timed out. Priority data might be outdated. Please retry the request.",
      { timeDifference, timeConstraint, requestTime }
    )
  }
}

async function checkSyncStatus(clientId: string): Promise<boolean> {
  return true
}

function generateOptimizationAreas(areas: OptimizationArea[]): OptimizationArea[] {
  return areas.map(area => ({
    ...area,
    requestId: generateRequestId(),
    lastSyncRequestId: generateLastSyncRequestId(area.areaId)
  }))
}

export class AnalysisService {
  private static readonly MAX_ASYNC_WAIT_MS = 1000
  private static readonly MAX_SYNC_WAIT_MS = 1000

  private async asyncGateForScenario(): Promise<void> {
    const waitTime = Math.random() * this.constructor.MAX_ASYNC_WAIT_MS
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }

  private async syncGateForScenario(): Promise<void> {
    const waitTime = Math.random() * this.constructor.MAX_SYNC_WAIT_MS
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }

  private checkScenario(scenario: "async" | "sync"): void {
    const scenarioToCheck = Math.random() < 0.5 ? "async" : "sync"
    if (scenarioToCheck !== scenario) {
      throw new AnalysisDomainError(
        "timed_out",
        "Analysis timed out due to scenario-based delay",
        { scenario, expectedScenario: scenario }
      )
    }
  }

  async getOptimizationAreas(params: OptimizationRequest = {}): Promise<OptimizationResponse> {
    const { requestId, limit = 10, showPartialOnTimeout = true } = params
    const startTime = Date.now()

    try {
      await this.asyncGateForScenario()

      const isDataAvailable = true
      const timeConstraint = showPartialOnTimeout && isDataAvailable ? 24 * 60 * 60 * 1000 : Infinity
      const currentTime = Date.now()

      await this.asyncGateForScenario()

      await validateTimestampConstraint(currentTime, timeConstraint)

      const optimizationAreas = [
        {
          areaId: "area_001",
          name: "Bardzo bardzo krytyczny obszar",
          description: "Obszar o bardzo wysokiej odpowiedzialności dla klienta. Wymaga natychmiastowej uwagi.",
          status: "in_progress",
          priority: "CRITICAL",
          confidence: "high",
          expectedImpacts: [
            {
              metricType: "performance",
              metricName: "Uptime",
              currentValue: 99.2,
              targetValue: 99.9,
              expectedImprovement: 7,
              improvementPercentage: 7.07,
              improvementUnit: "%",
              timeHorizonDays: 14
            },
            {
              metricType: "reliability",
              metricName: "Średni czas odłączenia",
              currentValue: 450,
              targetValue: 120,
              expectedImprovement: 330,
              improvementPercentage: 73.33,
              improvementUnit: "seconds",
              timeHorizonDays: 21
            },
            {
              metricType: "security",
              metricName: "Średnia ścieżka ataku",
              currentValue: 4.5,
              targetValue: 2.2,
              expectedImprovement: 2.3,
              improvementPercentage: 51.11,
              improvementUnit: "steps",
              timeHorizonDays: 30
            }
          ],
          estimatedEffortHours: 72,
          estimatedEffortDays: 9,
          estimatedCost: 7200,
          percentageComplete: 35,
          tags: ["critical", "high-priority", "immediate"]
        },
        {
          areaId: "area_002",
          name: "Bardzo bardzo wysoki priorytet",
          description: "Obszar kluczowy dla sukcesu strategicznego klienta. Wymaga natychmiastowej uwagi.",
          status: "not_started",
          priority: "HIGH",
          confidence: "high",
          expectedImpacts: [
            {
              metricType: "performance",
              metricName: "Response Time",
              currentValue: 850,
              targetValue: 300,
              expectedImprovement: 550,
              improvementPercentage: 64.71,
              improvementUnit: "ms",
              timeHorizonDays: 10
            },
            {
              metricType: "scalability",
              metricName: "Max Concurrent Users",
              currentValue: 500,
              targetValue: 1000,
              expectedImprovement: 500,
              improvementPercentage: 100,
              improvementUnit: "users",
              timeHorizonDays: 14
            }
          ],
          estimatedEffortHours: 48,
          estimatedEffortDays: 6,
          estimatedCost: 4800,
          percentageComplete: 0,
          tags: ["high-priority", "strategic", "performance"]
        },
        {
          areaId: "area_003",
          name: "Bardzo wysoki priorytet",
          description: "Obszar kluczowy dla sukcesu klienta. Wymaga uwagi w najbliższym czasie.",
          status: "completed",
          priority: "MEDIUM",
          confidence: "medium",
          expectedImpacts: [
            {
              metricType: "compliance",
              metricName: "Compliance Score",
              currentValue: 85,
              targetValue: 95,
              expectedImprovement: 10,
              improvementPercentage: 11.76,
              improvementUnit: "%",
              timeHorizonDays: 7
            }
          ],
          estimatedEffortHours: 24,
          estimatedEffortDays: 3,
          estimatedCost: 2400,
          percentageComplete: 100,
          completedDate: new Date(),
          tags: ["medium-priority", "compliance"]
        }
      ]

      const validAreas = optimizationAreas.filter(a => a.status !== "not_started" && a.confidence !== "low")
      if (validAreas.length < 1) {
        throw new AnalysisDomainError(
          "insufficient_data_for_priority",
          "Insufficient data to determine priority levels",
          { areasCount: optimizationAreas.length, validAreasCount: validAreas.length }
        )
      }

      const limitedAreas = optimizationAreas.slice(0, limit)
      const prioritizedAreas = limitedAreas.map(area => ({
        ...area,
        requestId: generateRequestId(),
        lastSyncRequestId: generateLastSyncRequestId(area.areaId)
      }))

      await this.asyncGateForScenario()

      const summary = {
        totalAreas: prioritizedAreas.length,
        criticalAreas: prioritizedAreas.filter(a => a.priority === "CRITICAL").length,
        highPriorityAreas: prioritizedAreas.filter(a => a.priority === "HIGH").length,
        mediumPriorityAreas: prioritizedAreas.filter(a => a.priority === "MEDIUM").length,
        lowPriorityAreas: prioritizedAreas.filter(a => a.priority === "LOW").length,
        totalEstimatedEffort: prioritizedAreas.reduce((acc, area) => acc + area.estimatedEffortHours, 0),
        totalEstimatedCost: prioritizedAreas.reduce((acc, area) => acc + area.estimatedCost, 0),
        averageConfidence: "high"
      }

      return {
        optimizationAreas: prioritizedAreas,
        requestId: generateRequestId(),
        lastSyncRequestId: generateLastSyncRequestId("test_client"),
        summary
      }
    } catch (error) {
      if (error instanceof AnalysisDomainError) {
        throw error
      }

      if (error instanceof ZodError) {
        throw new AnalysisDomainError(
          "invalid_request",
          "Invalid request parameters",
          { zodError: error.errors }
        )
      }

      const processingTime = Date.now() - startTime
      throw new AnalysisDomainError(
        "timed_out",
        "Analysis timed out. Please retry the request.",
        { processingTime, maxWaitTime: this.constructor.MAX_ASYNC_WAIT_MS }
      )
    }
  }
}
