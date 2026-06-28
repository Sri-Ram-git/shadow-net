from pydantic import BaseModel, Field
from typing import Optional


class NodeResponse(BaseModel):
    name: str
    role: str
    status: str
    cpu_usage: float
    memory_usage: float
    pod_count: int
    restart_count: int
    ip_address: str
    os_image: str
    kubelet_version: str
    last_heartbeat: str


class ClusterMetricsResponse(BaseModel):
    nodes: list[NodeResponse]
    total_pods: int
    healthy_pods: int
    total_cpu: float
    used_cpu: float
    total_memory: float
    used_memory: float
    network_health: float
