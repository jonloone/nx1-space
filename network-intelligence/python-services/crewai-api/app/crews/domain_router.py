"""
CrewAI Domain Router

Routes queries to appropriate domain-specific crews based on:
1. Explicit domain specification
2. Query content analysis
3. Context clues

Supports routing to:
- Ground Intelligence Crew
- Maritime Intelligence Crew
- Space Intelligence Crew
- Route Intelligence Crew (existing)
- Multi-domain orchestration
"""
import re
from typing import Dict, Any, Optional, Tuple
from enum import Enum


class IntelDomain(str, Enum):
    GROUND = "ground"
    MARITIME = "maritime"
    SPACE = "space"
    ROUTE = "route"
    ALL = "all"


# Domain-specific keywords for auto-detection
DOMAIN_KEYWORDS = {
    IntelDomain.GROUND: [
        "building", "infrastructure", "airport", "hospital", "school",
        "road", "highway", "address", "poi", "place", "commercial",
        "residential", "industrial", "urban", "city", "downtown"
    ],
    IntelDomain.MARITIME: [
        "port", "seaport", "harbor", "vessel", "ship", "maritime",
        "ocean", "sea", "cargo", "container", "shipping", "ais",
        "tanker", "bulk", "cruise", "ferry", "naval", "coast"
    ],
    IntelDomain.SPACE: [
        "satellite", "orbit", "space", "leo", "meo", "geo",
        "ground station", "antenna", "tle", "norad", "starlink",
        "imagery", "sar", "coverage", "pass", "constellation"
    ],
    IntelDomain.ROUTE: [
        "route", "path", "navigate", "from", "to", "drive",
        "walk", "travel", "journey", "waypoint", "direction"
    ]
}


class DomainRouter:
    """
    Routes intelligence queries to appropriate domain-specific crews
    """

    def __init__(self):
        self.crew_instances = {}

    def detect_domain(self, query: str, explicit_domain: Optional[str] = None) -> IntelDomain:
        """
        Detect the appropriate domain for a query

        Args:
            query: The user's natural language query
            explicit_domain: Explicitly specified domain (if any)

        Returns:
            IntelDomain enum value
        """
        # If explicit domain is specified and valid, use it
        if explicit_domain:
            try:
                return IntelDomain(explicit_domain.lower())
            except ValueError:
                pass  # Fall through to auto-detection

        query_lower = query.lower()

        # Count keyword matches per domain
        domain_scores: Dict[IntelDomain, int] = {
            domain: sum(1 for kw in keywords if kw in query_lower)
            for domain, keywords in DOMAIN_KEYWORDS.items()
        }

        # Find domain with highest score
        max_score = max(domain_scores.values())

        if max_score == 0:
            # No clear domain detected, check for route patterns
            if self._has_route_pattern(query_lower):
                return IntelDomain.ROUTE
            return IntelDomain.ALL

        # Get domains with max score (handle ties)
        top_domains = [d for d, s in domain_scores.items() if s == max_score]

        if len(top_domains) == 1:
            return top_domains[0]

        # If multiple domains tie, prefer based on priority
        priority = [IntelDomain.ROUTE, IntelDomain.MARITIME, IntelDomain.SPACE, IntelDomain.GROUND]
        for domain in priority:
            if domain in top_domains:
                return domain

        return IntelDomain.ALL

    def _has_route_pattern(self, query: str) -> bool:
        """Check if query has a route/navigation pattern"""
        route_patterns = [
            r'\bfrom\s+.+\s+to\s+',
            r'\broute\s+(between|from|to)',
            r'\bnavigate\s+(to|from)',
            r'\bdrive\s+(to|from)',
            r'\bpath\s+(between|from|to)'
        ]
        return any(re.search(pattern, query) for pattern in route_patterns)

    async def route_query(
        self,
        query: str,
        context: Dict[str, Any],
        explicit_domain: Optional[str] = None,
        verbose: bool = False
    ) -> Tuple[IntelDomain, Dict[str, Any]]:
        """
        Route a query to the appropriate crew and execute it

        Args:
            query: The user's query
            context: Query context (map state, previous queries, etc.)
            explicit_domain: Explicitly specified domain
            verbose: Whether to enable verbose output

        Returns:
            Tuple of (domain, result_dict)
        """
        # Detect domain
        domain = self.detect_domain(query, explicit_domain)
        print(f"🎯 Routing to {domain.value} domain")

        # Route to appropriate crew
        if domain == IntelDomain.GROUND:
            from app.crews.ground_intelligence import GroundIntelligenceCrew
            crew = GroundIntelligenceCrew(query, context, verbose)
            result = await crew.execute()

        elif domain == IntelDomain.MARITIME:
            from app.crews.maritime_intelligence import MaritimeIntelligenceCrew
            crew = MaritimeIntelligenceCrew(query, context, verbose)
            result = await crew.execute()

        elif domain == IntelDomain.SPACE:
            from app.crews.space_intelligence import SpaceIntelligenceCrew
            crew = SpaceIntelligenceCrew(query, context, verbose)
            result = await crew.execute()

        elif domain == IntelDomain.ROUTE:
            from app.crews.route_intelligence import RouteIntelligenceCrew
            crew = RouteIntelligenceCrew(query, context, verbose)
            result = await crew.execute()

        else:  # ALL domain - run multi-domain analysis
            result = await self._execute_multi_domain(query, context, verbose)

        return domain, result

    async def _execute_multi_domain(
        self,
        query: str,
        context: Dict[str, Any],
        verbose: bool
    ) -> Dict[str, Any]:
        """
        Execute multi-domain analysis when no single domain is appropriate

        This runs relevant crews in parallel and synthesizes results.
        """
        import asyncio

        print("🌐 Executing multi-domain analysis...")

        # Determine which domains are relevant
        query_lower = query.lower()
        relevant_domains = []

        for domain, keywords in DOMAIN_KEYWORDS.items():
            if domain != IntelDomain.ROUTE:  # Exclude route for multi-domain
                if any(kw in query_lower for kw in keywords):
                    relevant_domains.append(domain)

        # If no specific domains detected, run all three main domains
        if not relevant_domains:
            relevant_domains = [IntelDomain.GROUND, IntelDomain.MARITIME, IntelDomain.SPACE]

        print(f"   Relevant domains: {[d.value for d in relevant_domains]}")

        # Execute relevant crews
        tasks = []
        for domain in relevant_domains:
            if domain == IntelDomain.GROUND:
                from app.crews.ground_intelligence import GroundIntelligenceCrew
                crew = GroundIntelligenceCrew(query, context, verbose)
            elif domain == IntelDomain.MARITIME:
                from app.crews.maritime_intelligence import MaritimeIntelligenceCrew
                crew = MaritimeIntelligenceCrew(query, context, verbose)
            elif domain == IntelDomain.SPACE:
                from app.crews.space_intelligence import SpaceIntelligenceCrew
                crew = SpaceIntelligenceCrew(query, context, verbose)
            else:
                continue

            tasks.append((domain, crew.execute()))

        # Gather results
        results = []
        for domain, task in tasks:
            try:
                result = await task
                result["domain"] = domain.value
                results.append(result)
            except Exception as e:
                print(f"   ⚠️  {domain.value} crew failed: {e}")

        # Synthesize multi-domain results
        combined_output = self._synthesize_results(query, results)

        return {
            "success": all(r.get("success", False) for r in results),
            "output": combined_output,
            "task_results": [],
            "artifacts": [a for r in results for a in r.get("artifacts", [])],
            "actions": [a for r in results for a in r.get("actions", [])],
            "domains_analyzed": [r.get("domain") for r in results]
        }

    def _synthesize_results(self, query: str, results: list) -> str:
        """Synthesize results from multiple domain crews"""
        synthesis = f"""## MULTI-DOMAIN INTELLIGENCE REPORT

### Query: {query}

### Domains Analyzed: {', '.join(r.get('domain', 'unknown') for r in results)}

"""
        for result in results:
            domain = result.get("domain", "unknown").upper()
            output = result.get("output", "No output available")

            synthesis += f"""
---

### {domain} DOMAIN

{output[:2000]}...
""" if len(output) > 2000 else f"""
---

### {domain} DOMAIN

{output}
"""

        synthesis += """
---

### CROSS-DOMAIN RECOMMENDATIONS

Based on the multi-domain analysis above, operators should:
1. Correlate findings across domains for comprehensive situational awareness
2. Prioritize domain-specific insights based on operational requirements
3. Consider interdependencies between ground, maritime, and space assets
"""

        return synthesis


# Singleton router instance
_router_instance: Optional[DomainRouter] = None


def get_domain_router() -> DomainRouter:
    """Get or create the domain router singleton"""
    global _router_instance
    if _router_instance is None:
        _router_instance = DomainRouter()
    return _router_instance
