"""
Enhanced FastAPI backend for CrewAI agents with specialized domain expertise
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import json
import os
from dotenv import load_dotenv
import asyncio
import logging

# Import specialized agents
from agents.geospatial_analyst import GeospatialAnalystAgent
from agents.satcom_expert import SATCOMExpertAgent
from agents.network_optimizer import NetworkOptimizerAgent
from agents.business_intelligence import BusinessIntelligenceAgent
from agents.regulatory_compliance import RegulatoryComplianceAgent

# Import specialized crews
from crews.specialized_crews import (
    CrewOrchestrator,
    GroundStationAnalysisCrew,
    NetworkOptimizationCrew,
    RegulatoryComplianceCrew,
    MarketIntelligenceCrew,
    EmergencyResponseCrew
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NexusOne Ground Station Intelligence API",
    description="CrewAI-powered agents for satellite ground station operations with Vultr LLM",
    version="2.0.0"
)

# Configure CORS
cors_origins = json.loads(os.getenv("CORS_ORIGINS", '["http://localhost:3000", "http://localhost:3001", "http://localhost:3003", "http://137.220.61.218:3000", "http://137.220.61.218:3001", "http://137.220.61.218:3003"]'))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents
agents = {
    "geospatial": GeospatialAnalystAgent(),
    "satcom": SATCOMExpertAgent(),
    "network": NetworkOptimizerAgent(),
    "business": BusinessIntelligenceAgent(),
    "regulatory": RegulatoryComplianceAgent()
}

# Initialize crew orchestrator
crew_orchestrator = CrewOrchestrator()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Request/Response models
class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    agent_type: Optional[str] = "auto"
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    agent_used: str
    confidence: float
    actions: Optional[List[Dict[str, Any]]] = []
    metadata: Optional[Dict[str, Any]] = None

class AnalysisRequest(BaseModel):
    analysis_type: str
    parameters: Dict[str, Any]
    crews: Optional[List[str]] = None

class CrewRequest(BaseModel):
    crew_type: str
    task_description: str
    context: Dict[str, Any]

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "NexusOne Ground Station Intelligence API",
        "version": "2.0.0",
        "status": "operational",
        "agents": list(agents.keys()),
        "crews": ["ground_station", "network", "regulatory", "market", "emergency"]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agents_loaded": len(agents),
        "crews_available": 5,
        "llm_connected": True
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    """Main chat endpoint with intelligent agent routing"""
    try:
        message = request.message.lower()
        context = request.context or {}
        
        # Intelligent agent routing based on message content
        if any(word in message for word in ["location", "coverage", "distance", "cluster", "geographic", "map", "station", "spatial", "coordinates", "viewshed"]):
            agent = agents["geospatial"]
            agent_name = "geospatial"
        elif any(word in message for word in ["link", "satellite", "orbital", "frequency", "modulation", "interference"]):
            agent = agents["satcom"]
            agent_name = "satcom"
        elif any(word in message for word in ["network", "capacity", "routing", "load", "qos", "optimization"]):
            agent = agents["network"]
            agent_name = "network"
        elif any(word in message for word in ["revenue", "market", "cost", "roi", "business", "pricing", "customer"]):
            agent = agents["business"]
            agent_name = "business"
        elif any(word in message for word in ["license", "fcc", "itu", "compliance", "regulatory", "filing", "itar"]):
            agent = agents["regulatory"]
            agent_name = "regulatory"
        else:
            # Default to business intelligence for general queries
            agent = agents["business"]
            agent_name = "business"
        
        # Execute agent task
        result = agent.execute(request.message, context)
        
        # Check if result contains actions (JSON with response and actions)
        actions = []
        response_text = result
        
        try:
            # Try to parse result as JSON in case agent returns structured response
            if isinstance(result, str) and result.strip().startswith('{'):
                parsed_result = json.loads(result)
                if 'response' in parsed_result:
                    response_text = parsed_result['response']
                    actions = parsed_result.get('actions', [])
        except:
            # If not JSON, use result as plain text response
            response_text = result
        
        return ChatResponse(
            response=response_text,
            agent_used=agent_name,
            confidence=0.85,
            actions=actions,
            metadata={
                "session_id": request.session_id,
                "context_used": bool(context)
            }
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/geospatial")
async def analyze_geospatial(request: Dict[str, Any]):
    """Geospatial analysis endpoint"""
    try:
        agent = agents["geospatial"]
        
        analysis_type = request.get("type", "coverage")
        
        if analysis_type == "coverage":
            result = agent.analyze_coverage_gaps(
                request.get("stations", []),
                request.get("target_area")
            )
        elif analysis_type == "optimal_location":
            result = agent.calculate_optimal_location(
                request.get("existing_stations", []),
                request.get("demand_points", []),
                request.get("constraints")
            )
        elif analysis_type == "viewshed":
            result = agent.viewshed_analysis(
                request.get("location"),
                request.get("radius_km", 100),
                request.get("frequency_ghz", 14)
            )
        else:
            result = {"error": "Unknown analysis type"}
        
        return {"status": "success", "result": result}
        
    except Exception as e:
        logger.error(f"Geospatial analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/satcom")
async def analyze_satcom(request: Dict[str, Any]):
    """SATCOM analysis endpoint"""
    try:
        agent = agents["satcom"]
        
        analysis_type = request.get("type", "link_budget")
        
        if analysis_type == "link_budget":
            result = agent.calculate_link_budget(
                request.get("frequency_ghz", 14.25),
                request.get("distance_km", 36000),
                request.get("tx_power_dbm", 30),
                request.get("tx_gain_dbi", 45),
                request.get("rx_gain_dbi", 35),
                request.get("rain_margin_db", 3)
            )
        elif analysis_type == "orbital_coverage":
            result = agent.analyze_orbital_coverage(
                request.get("altitude_km", 550),
                request.get("inclination", 53),
                request.get("lat", 40),
                request.get("lon", -74),
                request.get("min_elevation", 10)
            )
        elif analysis_type == "modulation":
            result = agent.modulation_coding_optimization(
                request.get("link_margin_db", 6),
                request.get("bandwidth_mhz", 36),
                request.get("throughput_mbps", 100)
            )
        else:
            result = {"error": "Unknown analysis type"}
        
        return {"status": "success", "result": result}
        
    except Exception as e:
        logger.error(f"SATCOM analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/network")
async def analyze_network(request: Dict[str, Any]):
    """Network optimization analysis endpoint"""
    try:
        agent = agents["network"]
        
        analysis_type = request.get("type", "topology")
        
        if analysis_type == "topology":
            result = agent.optimize_network_topology(
                request.get("stations", []),
                request.get("traffic_matrix")
            )
        elif analysis_type == "capacity":
            result = agent.capacity_planning_analysis(
                request.get("current_demand", {}),
                request.get("growth_rate", 0.15),
                request.get("planning_horizon", 3)
            )
        elif analysis_type == "qos":
            result = agent.qos_optimization(
                request.get("traffic_classes", {}),
                request.get("bandwidth_gbps", 10)
            )
        else:
            result = {"error": "Unknown analysis type"}
        
        return {"status": "success", "result": result}
        
    except Exception as e:
        logger.error(f"Network analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/business")
async def analyze_business(request: Dict[str, Any]):
    """Business intelligence analysis endpoint"""
    try:
        agent = agents["business"]
        
        analysis_type = request.get("type", "market")
        
        if analysis_type == "market":
            result = agent.market_analysis(
                request.get("region", "North America"),
                request.get("market_size", 1000),
                request.get("competitors", []),
                request.get("growth_rate", 0.08)
            )
        elif analysis_type == "revenue":
            result = agent.revenue_optimization(
                request.get("current_revenue", {}),
                request.get("utilization_rates", {}),
                request.get("pricing_model", "usage_based")
            )
        elif analysis_type == "investment":
            result = agent.investment_analysis(
                request.get("amount", 1000000),
                request.get("investment_type", "expansion"),
                request.get("expected_returns", []),
                request.get("risk_factors")
            )
        else:
            result = {"error": "Unknown analysis type"}
        
        return {"status": "success", "result": result}
        
    except Exception as e:
        logger.error(f"Business analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/regulatory")
async def analyze_regulatory(request: Dict[str, Any]):
    """Regulatory compliance analysis endpoint"""
    try:
        agent = agents["regulatory"]
        
        analysis_type = request.get("type", "licensing")
        
        if analysis_type == "licensing":
            result = agent.licensing_requirements_analysis(
                request.get("station_type", "gateway"),
                request.get("location", {"country": "USA"}),
                request.get("frequency_bands", ["Ku-band"]),
                request.get("service_type", "FSS")
            )
        elif analysis_type == "compliance_audit":
            result = agent.compliance_audit(
                request.get("licenses", []),
                request.get("operations", {}),
                request.get("last_audit")
            )
        elif analysis_type == "spectrum":
            result = agent.spectrum_coordination(
                request.get("frequency", 14250),
                request.get("bandwidth", 36),
                request.get("location", {}),
                request.get("existing_operators", [])
            )
        else:
            result = {"error": "Unknown analysis type"}
        
        return {"status": "success", "result": result}
        
    except Exception as e:
        logger.error(f"Regulatory analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/crew/execute")
async def execute_crew(request: CrewRequest):
    """Execute a specialized crew for complex analysis"""
    try:
        result = crew_orchestrator.process_request(
            request.crew_type,
            request.context
        )
        return result
        
    except Exception as e:
        logger.error(f"Crew execution error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/crew/multi-analysis")
async def multi_crew_analysis(request: AnalysisRequest):
    """Execute multiple crews for comprehensive analysis"""
    try:
        analysis_request = {
            "crews": request.crews or ["ground_station", "network"],
            **request.parameters
        }
        
        result = crew_orchestrator.multi_crew_analysis(analysis_request)
        return result
        
    except Exception as e:
        logger.error(f"Multi-crew analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(websocket)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process with appropriate agent
            request = ChatRequest(**message_data)
            response = await chat(request)
            
            # Send response back to client
            await manager.send_personal_message(
                json.dumps(response.dict()),
                websocket
            )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket)

@app.get("/agents")
async def list_agents():
    """List available agents and their capabilities"""
    return {
        "agents": [
            {
                "id": "geospatial",
                "name": "Geospatial Analyst",
                "capabilities": [
                    "Coverage gap analysis",
                    "Optimal location calculation",
                    "Viewshed analysis",
                    "Station clustering",
                    "Weather impact assessment"
                ]
            },
            {
                "id": "satcom",
                "name": "SATCOM Operations Expert",
                "capabilities": [
                    "Link budget calculation",
                    "Orbital coverage analysis",
                    "Frequency coordination",
                    "Modulation optimization",
                    "Interference mitigation"
                ]
            },
            {
                "id": "network",
                "name": "Network Optimizer",
                "capabilities": [
                    "Topology optimization",
                    "Capacity planning",
                    "Load balancing",
                    "QoS optimization",
                    "Cost optimization"
                ]
            },
            {
                "id": "business",
                "name": "Business Intelligence",
                "capabilities": [
                    "Market analysis",
                    "Revenue optimization",
                    "Customer lifetime value",
                    "Investment analysis",
                    "Pricing strategy"
                ]
            },
            {
                "id": "regulatory",
                "name": "Regulatory Compliance",
                "capabilities": [
                    "Licensing requirements",
                    "Compliance audits",
                    "Spectrum coordination",
                    "ITAR compliance",
                    "Environmental assessments"
                ]
            }
        ]
    }

@app.get("/crews")
async def list_crews():
    """List available crews and their purposes"""
    return {
        "crews": [
            {
                "id": "ground_station",
                "name": "Ground Station Analysis Crew",
                "purpose": "Comprehensive analysis for new ground station deployments",
                "agents": ["geospatial", "satcom", "network", "business", "regulatory"]
            },
            {
                "id": "network",
                "name": "Network Optimization Crew",
                "purpose": "Network performance optimization across multiple dimensions",
                "agents": ["network", "satcom", "business"]
            },
            {
                "id": "regulatory",
                "name": "Regulatory Compliance Crew",
                "purpose": "Compliance assessment and licensing support",
                "agents": ["regulatory", "satcom", "business"]
            },
            {
                "id": "market",
                "name": "Market Intelligence Crew",
                "purpose": "Market opportunity and competitive analysis",
                "agents": ["business", "geospatial", "network"]
            },
            {
                "id": "emergency",
                "name": "Emergency Response Crew",
                "purpose": "Critical incident response and service restoration",
                "agents": ["satcom", "network", "regulatory"]
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)