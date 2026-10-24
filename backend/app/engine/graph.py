from typing import Dict, List, Set, Any, Tuple
import re

class GraphValidationError(Exception):
    pass

class WorkflowGraphEngine:
    def __init__(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        self.nodes = {n["id"]: n for n in nodes}
        self.edges = edges
        self.adj: Dict[str, List[str]] = {n["id"]: [] for n in nodes}
        self.pred: Dict[str, List[str]] = {n["id"]: [] for n in nodes}
        self._build_graph()

    def _build_graph(self):
        for edge in self.edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if src in self.nodes and tgt in self.nodes:
                self.adj[src].append(tgt)
                self.pred[tgt].append(src)

    def validate_dag(self) -> bool:
        """Checks for cycles using DFS and colors (0: unvisited, 1: visiting, 2: visited)."""
        visited: Dict[str, int] = {node_id: 0 for node_id in self.nodes}

        def dfs(node_id: str) -> bool:
            visited[node_id] = 1
            for neighbor in self.adj[node_id]:
                if visited[neighbor] == 1:
                    return False  # Cycle detected
                if visited[neighbor] == 0:
                    if not dfs(neighbor):
                        return False
            visited[node_id] = 2
            return True

        for node_id in self.nodes:
            if visited[node_id] == 0:
                if not dfs(node_id):
                    raise GraphValidationError(f"Workflow contains a directed cycle involving node '{node_id}'. Workflows must be Directed Acyclic Graphs (DAGs).")
        return True

    def get_topological_batches(self) -> List[List[str]]:
        """
        Returns topological stages/batches where nodes in the same batch
        have no dependencies on each other and can execute concurrently.
        """
        self.validate_dag()
        in_degrees = {node_id: len(self.pred[node_id]) for node_id in self.nodes}
        current_batch = [node_id for node_id, deg in in_degrees.items() if deg == 0]
        batches = []

        while current_batch:
            batches.append(current_batch)
            next_batch = []
            for node_id in current_batch:
                for neighbor in self.adj[node_id]:
                    in_degrees[neighbor] -= 1
                    if in_degrees[neighbor] == 0:
                        next_batch.append(neighbor)
            current_batch = next_batch

        # Check if all nodes were processed
        flattened = [item for sub in batches for item in sub]
        if len(flattened) != len(self.nodes):
            missing = set(self.nodes.keys()) - set(flattened)
            raise GraphValidationError(f"Could not schedule nodes: {missing}. Graph may contain unreachable cycles or broken dependencies.")

        return batches

    def get_upstream_ancestors(self, node_id: str) -> Set[str]:
        """Recursively get all upstream node IDs that feed into this node."""
        ancestors = set()
        queue = list(self.pred.get(node_id, []))
        while queue:
            curr = queue.pop(0)
            if curr not in ancestors:
                ancestors.add(curr)
                queue.extend(self.pred.get(curr, []))
        return ancestors

    def get_direct_parents(self, node_id: str) -> List[str]:
        """Get immediate parent nodes that have edges pointing to this node."""
        return self.pred.get(node_id, [])

    @staticmethod
    def slugify(text: str) -> str:
        """Helper to create slug from node label for clean variable references."""
        s = text.lower().strip()
        s = re.sub(r'[^\w\s-]', '', s)
        s = re.sub(r'[\s_-]+', '_', s)
        return s.strip('_')
