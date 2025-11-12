export interface Task {
  id: number;
  taskId: string;
  timestamp: string;
  userName: string;
  userContact: string;
  createdByUserId: number;
  taskDescription: string;
  area: string;
  dateNeeded: string;
  budget: number;
  notes?: string;
  paymentStatus: PaymentStatus;
  taskStatus: TaskStatus;
  helperName?: string;
  helperContact?: string;
  helperEmail?: string;
  acceptedByUserId?: number;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  paidToRunnerAt?: string;
  
  // Automation fields
  autoActions?: AutoAction[];
  predictions?: TaskPrediction;
  reminders?: TaskReminder[];
}

export type PaymentStatus = 'pending' | 'verified' | 'failed' | 'expired' | 'refunded';

export type TaskStatus = 
  | 'draft' 
  | 'posted' 
  | 'claimed' 
  | 'in_progress' 
  | 'completed' 
  | 'confirmed'
  | 'runner_paid' 
  | 'cancelled'
  | 'disputed';

export type Priority = 'standard' | 'urgent' | 'low';

export interface AutoAction {
  type: 'reminder' | 'auto_complete' | 'auto_rate' | 'escalate';
  scheduledFor: string;
  executed: boolean;
  result?: string;
}

export interface TaskPrediction {
  estimatedCompletion: string;
  confidenceLevel: number;
  riskFactors: string[];
  suggestions: string[];
}

export interface TaskReminder {
  id: string;
  type: 'deadline' | 'payment' | 'update' | 'rating';
  scheduledFor: string;
  sent: boolean;
  message: string;
}

export interface TaskFilter {
  paymentStatus?: PaymentStatus[];
  taskStatus?: TaskStatus[];
  priority?: Priority[];
  area?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  budgetRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  averageCompletionTime: number;
  successRate: number;
  averageRating: number;
  totalEarnings: number;
}

export interface TaskAutomationSettings {
  autoAcceptTasks: boolean;
  autoCompleteAfterHours: number;
  autoRateAfterDays: number;
  reminderIntervals: number[];
  preferredAreas: string[];
  maxBudget: number;
  minBudget: number;
}