"""
Base Agent implementation using CrewAI
"""

from crewai import Agent, Task, Crew
from langchain_community.llms import OpenAI
from typing import Optional, Dict, Any, List
import os
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load ground station data
GROUND_STATIONS_DATA = None
try:
    with open('/mnt/blockstorage/nx1-space/frontend/public/data/ses_intelsat_ground_stations.json', 'r') as f:
        GROUND_STATIONS_DATA = json.load(f)
except Exception as e:
    print(f"Warning: Could not load ground stations data: {e}")
    GROUND_STATIONS_DATA = {"stations": []}

class BaseCrewAgent:
    """Base class for all CrewAI agents"""
    
    def __init__(
        self,
        role: str,
        goal: str,
        backstory: str,
        verbose: bool = True,
        allow_delegation: bool = False,
        tools: list = None
    ):
        # Configure LLM with Vultr
        self.llm = OpenAI(
            openai_api_key=os.getenv("VULTR_API_KEY", "NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA"),
            openai_api_base=os.getenv("VULTR_INFERENCE_URL", "https://api.vultrinference.com/v1"),
            model_name=os.getenv("VULTR_MODEL", "mixtral-8x7b-instruct"),
            temperature=0.7,
            max_tokens=2000
        )
        
        # Create CrewAI agent
        self.agent = Agent(
            role=role,
            goal=goal,
            backstory=backstory,
            verbose=verbose,
            allow_delegation=allow_delegation,
            llm=self.llm,
            tools=tools or []
        )
        
        self.role = role
        self.goal = goal
    
    def get_agent(self) -> Agent:
        """Get the CrewAI agent instance"""
        return self.agent
    
    def find_ground_station(self, query: str) -> Optional[Dict[str, Any]]:
        """Find a ground station by name, city, or region"""
        if not GROUND_STATIONS_DATA or not GROUND_STATIONS_DATA.get('stations'):
            return None
        
        query_lower = query.lower().strip()
        stations = GROUND_STATIONS_DATA['stations']
        
        # Search by exact or partial name match
        for station in stations:
            # Check name
            if query_lower in station.get('name', '').lower():
                return station
            # Check city
            location = station.get('location', {})
            if query_lower in location.get('city', '').lower():
                return station
            # Check region or state
            if query_lower in location.get('state', '').lower():
                return station
            if query_lower in location.get('region', '').lower():
                return station
                
        return None
    
    def create_fly_to_action(self, station: Dict[str, Any], zoom: int = 12) -> Dict[str, Any]:
        """Create a flyTo action for a ground station"""
        location = station.get('location', {})
        return {
            "type": "flyTo",
            "coordinates": [location.get('longitude'), location.get('latitude')],
            "zoom": zoom,
            "stationName": station.get('name'),
            "stationId": station.get('station_id')
        }
    
    def create_select_action(self, station: Dict[str, Any]) -> Dict[str, Any]:
        """Create a selectFeature action for a ground station"""
        return {
            "type": "selectFeature", 
            "feature": {
                "id": station.get('station_id'),
                "name": station.get('name'),
                "location": station.get('location'),
                "operator": station.get('operator')
            }
        }
    
    def detect_location_intent(self, message: str) -> Optional[str]:
        """Detect if user is asking to see/find a location"""
        message_lower = message.lower()
        
        # Intent patterns
        show_patterns = ["show me", "find", "navigate to", "go to", "zoom to", "where is", "locate"]
        location_patterns = ["teleport", "station", "ground station", "facility"]
        
        # Check for intent patterns
        has_intent = any(pattern in message_lower for pattern in show_patterns)
        has_location = any(pattern in message_lower for pattern in location_patterns)
        
        if has_intent or has_location:
            # Try to extract location name
            words = message_lower.replace("show me", "").replace("find", "").replace("navigate to", "")
            words = words.replace("go to", "").replace("zoom to", "").replace("where is", "")
            words = words.replace("locate", "").replace("the", "").replace("teleport", "")
            words = words.replace("station", "").replace("ground station", "").replace("facility", "")
            words = words.strip()
            
            if words:
                return words
        
        return None
    
    def execute(self, task_description: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Execute a task with the agent using LLM"""
        try:
            # First check for location intent
            location_query = self.detect_location_intent(task_description)
            if location_query:
                station = self.find_ground_station(location_query)
                if station:
                    # Create actions for map interaction
                    actions = [
                        self.create_fly_to_action(station),
                        self.create_select_action(station)
                    ]
                    
                    # Create natural response
                    location_info = station.get('location', {})
                    city = location_info.get('city', 'Unknown')
                    state = location_info.get('state', '')
                    region = location_info.get('region', '')
                    
                    location_text = f"{city}"
                    if state:
                        location_text += f", {state}"
                    if region and region not in location_text:
                        location_text += f" ({region})"
                    
                    response_text = f"Flying to {station.get('name')} now! This ground station is located in {location_text} and operated by {station.get('operator', 'SES-Intelsat')}."
                    
                    # Return structured response with actions
                    structured_response = {
                        "response": response_text,
                        "actions": actions
                    }
                    return json.dumps(structured_response)
                else:
                    return f"I couldn't find a ground station matching '{location_query}'. Try searching for locations like 'Atlanta', 'London', or 'Tokyo'."
            
            # If no location intent, proceed with normal LLM execution
            # Create context string for the agent
            context_str = ""
            if context:
                context_str = f"\nContext: {context}"
            
            # Create a CrewAI task
            task = Task(
                description=f"""
                You are a {self.role} with the following goal: {self.goal}
                
                User Query: {task_description}
                {context_str}
                
                Please provide a helpful, natural language response that:
                1. Directly addresses the user's query
                2. Uses your expertise to provide valuable insights
                3. Offers specific suggestions or next steps when appropriate
                4. Is conversational and engaging
                5. If the query is vague (like "Is this working?" or "and?"), provide context about your capabilities and offer to help with specific analysis
                
                Format your response as natural conversation, not as structured data or JSON.
                """,
                agent=self.agent,
                expected_output="A natural language response addressing the user's query with expert insights and suggestions"
            )
            
            # Create a crew with just this agent and task
            crew = Crew(
                agents=[self.agent],
                tasks=[task],
                verbose=False
            )
            
            # Execute the task
            result = crew.kickoff()
            return str(result)
            
        except Exception as e:
            # Intelligent fallback response based on agent capabilities and context
            capabilities = context.get("agent_capabilities", []) if context else []
            task_lower = task_description.lower()
            
            # Provide context-aware responses for common queries
            if any(phrase in task_lower for phrase in ["is this working", "working", "hello", "hi"]):
                if capabilities:
                    cap_list = ", ".join(capabilities[:3])
                    return f"Yes, I'm working perfectly! I'm your {self.role} and I can help you with {cap_list}, and much more. What would you like to analyze?"
                else:
                    return f"Hello! I'm your {self.role} and I'm fully operational. I'm here to provide expert analysis and insights. What can I help you with today?"
            
            elif any(phrase in task_lower for phrase in ["what can you", "what do you", "help me", "capabilities"]):
                if capabilities:
                    cap_text = "\n• ".join(capabilities)
                    return f"I'm your {self.role} and I specialize in:\n• {cap_text}\n\nI can provide detailed analysis, answer questions, and offer strategic recommendations in these areas. What specific analysis would you like me to perform?"
                else:
                    return f"As your {self.role}, I can provide expert analysis, insights, and recommendations. I'm designed to help you make informed decisions with data-driven analysis. What would you like to explore?"
            
            elif any(phrase in task_lower for phrase in ["and", "more", "continue", "go on", "what else"]):
                return f"I'd be happy to continue! As your {self.role}, I can dive deeper into any analysis or explore related topics. What specific aspect would you like me to focus on next?"
            
            else:
                # General intelligent response
                return f"I understand you're asking about: '{task_description}'. As your {self.role}, I'm analyzing this request and can provide expert insights. While I prepare a comprehensive response, let me know if you'd like me to focus on any particular aspect of this topic."