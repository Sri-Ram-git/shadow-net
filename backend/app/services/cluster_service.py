import random
from app.services.base import BaseService


class ClusterService(BaseService):
    """Simulates Kubernetes cluster metrics for demo purposes.
    In production, this would call the Kubernetes API."""

    NODES = [
        {"name": "shadownet-control-1", "role": "control-plane", "ip": "10.0.0.1", "os": "Ubuntu 22.04 LTS", "kubelet": "v1.28.5"},
        {"name": "shadownet-worker-1", "role": "worker", "ip": "10.0.0.2", "os": "Ubuntu 22.04 LTS", "kubelet": "v1.28.5"},
        {"name": "shadownet-worker-2", "role": "worker", "ip": "10.0.0.3", "os": "Ubuntu 22.04 LTS", "kubelet": "v1.28.5"},
    ]

    PODS_PER_NODE = {
        "shadownet-control-1": 8,
        "shadownet-worker-1": 12,
        "shadownet-worker-2": 10,
    }

    def get_metrics(self) -> dict:
        nodes = []
        total_pods = 0
        healthy_pods = 0
        total_cpu = 0.0
        used_cpu = 0.0
        total_memory = 0.0
        used_memory = 0.0

        for node_cfg in self.NODES:
            pod_count = self.PODS_PER_NODE.get(node_cfg["name"], 8)

            cpu_usage = random.uniform(20, 85)
            memory_usage = random.uniform(25, 80)
            is_healthy = cpu_usage < 90 and memory_usage < 90

            node = {
                "name": node_cfg["name"],
                "role": node_cfg["role"],
                "status": "Ready" if is_healthy else random.choice(["Ready", "NotReady"]),
                "cpu_usage": round(cpu_usage, 1),
                "memory_usage": round(memory_usage, 1),
                "pod_count": pod_count,
                "restart_count": random.randint(0, 3),
                "ip_address": node_cfg["ip"],
                "os_image": node_cfg["os"],
                "kubelet_version": node_cfg["kubelet"],
                "last_heartbeat": "now",
            }
            nodes.append(node)
            total_pods += pod_count
            if node["status"] == "Ready":
                healthy_pods += pod_count
            total_cpu += 4.0
            used_cpu += 4.0 * (cpu_usage / 100)
            total_memory += 8.0
            used_memory += 8.0 * (memory_usage / 100)

        network_health = round(
            100 - (random.uniform(0, 5) if all(n["status"] == "Ready" for n in nodes) else random.uniform(5, 30)),
            1,
        )

        return {
            "nodes": nodes,
            "total_pods": total_pods,
            "healthy_pods": healthy_pods,
            "total_cpu": round(total_cpu, 1),
            "used_cpu": round(used_cpu, 1),
            "total_memory": round(total_memory, 1),
            "used_memory": round(used_memory, 1),
            "network_health": network_health,
        }
