export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  place_id?: string;
  landmark?: string;
  severity: Severity;
  status: IncidentStatus;
  image_url?: string;
  timestamp: string;
  synced: boolean;
}

export type IncidentCategory = 'fire' | 'medical' | 'flood' | 'earthquake' | 'infrastructure' | 'hazard' | 'other';
export type Severity = 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'open' | 'triaging' | 'dispatched' | 'resolved';

export interface AITriage {
  id: string;
  incident_id: string;
  severity: Severity;
  department: string;
  injured: number;
  critical: number;
  location: string;
  summary: string;
  raw_response: string;
  created_at: string;
}

export interface HazardCard {
  hazard: string;
  status: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface OperationalRecommendation {
  priority: number;
  action: string;
  reason: string;
}

export interface ResourceItem {
  resource: string;
  estimated: number;
  reason: string;
}

export interface ReasoningNode {
  detected: string;
  inference: string;
  reason: string;
}

export interface EscalationForecast {
  next_15_minutes: string[];
  next_hour: string[];
  next_6_hours: string[];
}

export interface TriageAnalysis {
  incident_type: string;
  priority: string;
  estimated_severity: Severity;
  confidence: number;
  source: string;
  executive_summary: string;
  confirmed_facts: string[];
  professional_assessment: string[];
  hazard_analysis: HazardCard[];
  risk_analysis: RiskItem[];
  operational_recommendations: OperationalRecommendation[];
  resource_estimation: ResourceItem[];
  escalation_forecast: EscalationForecast;
  reasoning_tree: ReasoningNode[];
}

export interface ClusterNode {
  name: string;
  role: 'control-plane' | 'worker';
  status: 'Ready' | 'NotReady' | 'Unknown';
  cpu_usage: number;
  memory_usage: number;
  pod_count: number;
  restart_count: number;
  ip_address: string;
  os_image: string;
  kubelet_version: string;
  last_heartbeat: string;
}

export interface ClusterMetrics {
  nodes: ClusterNode[];
  total_pods: number;
  healthy_pods: number;
  total_cpu: number;
  used_cpu: number;
  total_memory: number;
  used_memory: number;
  network_health: number;
}

export interface SyncQueueItem {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  payload: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retry_count: number;
  created_at: string;
  synced_at?: string;
}

export interface DashboardStats {
  total_incidents: number;
  critical_incidents: number;
  available_nodes: number;
  total_nodes: number;
  cluster_health: number;
  storage_usage: number;
  sync_pending: number;
  sync_total: number;
  recent_incidents: Incident[];
  incidents_by_severity: Record<string, number>;
  incidents_by_category: Record<string, number>;
}

export interface WebSocketMessage {
  type: 'incident_update' | 'cluster_update' | 'sync_update' | 'triage_update' | 'settings_changed' | 'notification';
  data: unknown;
  timestamp: string;
}

export interface CreateIncidentPayload {
  title: string;
  description: string;
  location: string;
  categories: string[];
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  place_id?: string;
  landmark?: string;
  image?: File;
}

export interface RiskItem {
  risk: string;
  percentage: number;
  reason: string;
}


