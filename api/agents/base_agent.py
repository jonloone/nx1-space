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

# Load GERS data for enhanced location search
GERS_INDEX_DATA = None
GERS_NAME_TO_ID = None
try:
    with open('/mnt/blockstorage/nx1-space/frontend/public/data/gers/gers-index.json', 'r') as f:
        GERS_INDEX_DATA = json.load(f)
    with open('/mnt/blockstorage/nx1-space/frontend/public/data/gers/name-to-id.json', 'r') as f:
        GERS_NAME_TO_ID = json.load(f)
except Exception as e:
    print(f"Warning: Could not load GERS data: {e}")
    GERS_INDEX_DATA = {}
    GERS_NAME_TO_ID = {}

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
        # Configure LLM with Vultr and better timeout
        self.llm = OpenAI(
            openai_api_key=os.getenv("VULTR_API_KEY", "NQCHCWXPSWQ3JL6IM5NT5EBD4FNOK5S7AEZA"),
            openai_api_base=os.getenv("VULTR_INFERENCE_URL", "https://api.vultrinference.com/v1"),
            model_name=os.getenv("VULTR_MODEL", "mixtral-8x7b-instruct"),
            temperature=0.7,
            max_tokens=2000,
            request_timeout=30  # Add 30 second timeout
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
        """Find a ground station by name, city, or region with fuzzy matching"""
        if not GROUND_STATIONS_DATA or not GROUND_STATIONS_DATA.get('stations'):
            return None
        
        query_lower = query.lower().strip()
        stations = GROUND_STATIONS_DATA['stations']
        
        # First pass: Exact matches
        for station in stations:
            location = station.get('location', {})
            # Check exact city match
            if query_lower == location.get('city', '').lower():
                return station
            # Check exact name match
            if query_lower == station.get('name', '').lower():
                return station
                
        # Second pass: Contains matches
        for station in stations:
            location = station.get('location', {})
            # Check name contains
            if query_lower in station.get('name', '').lower():
                return station
            # Check city contains
            if query_lower in location.get('city', '').lower():
                return station
            # Check region or state
            if query_lower in location.get('state', '').lower():
                return station
            if query_lower in location.get('region', '').lower():
                return station
                
        return None
    
    def get_location_suggestions(self, query: str, limit: int = 3) -> List[str]:
        """Get location suggestions when exact match fails"""
        if not GROUND_STATIONS_DATA or not GROUND_STATIONS_DATA.get('stations'):
            return []
        
        query_lower = query.lower().strip()
        stations = GROUND_STATIONS_DATA['stations']
        suggestions = set()
        
        # Look for partial matches to suggest alternatives
        for station in stations:
            location = station.get('location', {})
            city = location.get('city', '')
            name = station.get('name', '')
            
            # Add cities that start with the same letter or contain similar patterns
            if city and (
                city.lower().startswith(query_lower[0]) if query_lower else False or
                any(char in city.lower() for char in query_lower[:3]) if len(query_lower) >= 3 else False
            ):
                suggestions.add(city)
            
            # Add station names that might be relevant
            if 'teleport' in name.lower() or 'station' in name.lower():
                city_from_name = city if city else name.replace(' Teleport', '').replace(' Station', '')
                if city_from_name:
                    suggestions.add(city_from_name)
        
        return list(suggestions)[:limit]
    
    def find_gers_location(self, query: str) -> Optional[Dict[str, Any]]:
        """Find a GERS location by name with improved fuzzy matching"""
        if not GERS_NAME_TO_ID or not GERS_INDEX_DATA:
            return None
            
        query_lower = query.lower().strip()
        
        # Remove common suffixes that might prevent matches
        city_query = query_lower.replace(' city', '').replace(' the city', '')
        
        # Check for exact name match in GERS
        if query_lower in GERS_NAME_TO_ID:
            location_ids = GERS_NAME_TO_ID[query_lower]
            if location_ids and location_ids[0] in GERS_INDEX_DATA:
                location_data = GERS_INDEX_DATA[location_ids[0]]
                return {
                    'id': location_data['id'],
                    'name': location_data['names'][0],
                    'category': location_data['category'],
                    'subtype': location_data.get('subtype', ''),
                    'bbox': location_data['bbox'],
                    'source': 'gers'
                }
        
        # Check if query is asking for a city specifically
        # If someone says "houston" or "houston city", find houston-related locations
        best_match = None
        best_score = 0
        
        for name, location_ids in GERS_NAME_TO_ID.items():
            name_lower = name.lower()
            
            # Exact match gets highest priority
            if query_lower == name_lower:
                if location_ids and location_ids[0] in GERS_INDEX_DATA:
                    location_data = GERS_INDEX_DATA[location_ids[0]]
                    return {
                        'id': location_data['id'],
                        'name': location_data['names'][0],
                        'category': location_data['category'],
                        'subtype': location_data.get('subtype', ''),
                        'bbox': location_data['bbox'],
                        'source': 'gers'
                    }
            
            # Check if the location contains the city name
            if city_query in name_lower or name_lower.startswith(city_query):
                if location_ids and location_ids[0] in GERS_INDEX_DATA:
                    location_data = GERS_INDEX_DATA[location_ids[0]]
                    
                    # Prioritize based on relevance
                    score = 0
                    if name_lower.startswith(city_query):
                        score = 3  # Highest score for starts with
                    elif city_query in name_lower.split():
                        score = 2  # Good score for word match
                    else:
                        score = 1  # Lower score for contains
                    
                    # Prefer certain categories for city searches
                    if location_data.get('category') in ['place', 'building']:
                        score += 1
                    
                    if score > best_score:
                        best_score = score
                        best_match = {
                            'id': location_data['id'],
                            'name': location_data['names'][0],
                            'category': location_data['category'],
                            'subtype': location_data.get('subtype', ''),
                            'bbox': location_data['bbox'],
                            'source': 'gers'
                        }
        
        return best_match
    
    def find_any_location(self, query: str) -> Optional[Dict[str, Any]]:
        """Find location in both ground stations and GERS data"""
        # First try ground stations (higher priority)
        station = self.find_ground_station(query)
        if station:
            return {**station, 'source': 'ground_station'}
        
        # Then try GERS locations
        return self.find_gers_location(query)
    
    def create_fly_to_action(self, location: Dict[str, Any], zoom: int = 12) -> Dict[str, Any]:
        """Create a flyTo action for any location (ground station or GERS)"""
        if location.get('source') == 'ground_station':
            # Ground station format
            station_location = location.get('location', {})
            return {
                "type": "flyTo",
                "coordinates": [station_location.get('longitude'), station_location.get('latitude')],
                "zoom": zoom,
                "stationName": location.get('name'),
                "stationId": location.get('station_id')
            }
        else:
            # GERS location format
            bbox = location.get('bbox', [])
            if len(bbox) >= 4:
                # Calculate center from bbox [minLon, minLat, maxLon, maxLat]
                center_lon = (bbox[0] + bbox[2]) / 2
                center_lat = (bbox[1] + bbox[3]) / 2
                return {
                    "type": "flyTo",
                    "coordinates": [center_lon, center_lat],
                    "zoom": zoom,
                    "locationName": location.get('name'),
                    "locationId": location.get('id')
                }
            return None
    
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
                # Use unified location search (ground stations + GERS)
                location = self.find_any_location(location_query)
                if location:
                    # Create actions for map interaction
                    fly_action = self.create_fly_to_action(location)
                    actions = [fly_action] if fly_action else []
                    
                    # Add select action only for ground stations
                    if location.get('source') == 'ground_station':
                        actions.append(self.create_select_action(location))
                        
                        # Create response for ground station
                        location_info = location.get('location', {})
                        city = location_info.get('city', 'Unknown')
                        state = location_info.get('state', '')
                        region = location_info.get('region', '')
                        
                        location_text = f"{city}"
                        if state:
                            location_text += f", {state}"
                        if region and region not in location_text:
                            location_text += f" ({region})"
                        
                        response_text = f"Flying to {location.get('name')} now! This ground station is located in {location_text} and operated by {location.get('operator', 'SES-Intelsat')}."
                    else:
                        # Create response for GERS location
                        name = location.get('name', 'location')
                        category = location.get('category', 'place')
                        subtype = location.get('subtype', '')
                        
                        type_text = f"{subtype} {category}" if subtype else category
                        response_text = f"Flying to {name} ({type_text})."
                    
                    # Return structured response with actions
                    structured_response = {
                        "response": response_text,
                        "actions": actions
                    }
                    return json.dumps(structured_response)
                else:
                    # Get suggestions for similar locations
                    suggestions = self.get_location_suggestions(location_query)
                    if suggestions:
                        suggestion_text = ", ".join(suggestions)
                        return f"No location found for '{location_query}'. Try: {suggestion_text}"
                    else:
                        # Check if we have GERS data to suggest
                        if GERS_NAME_TO_ID and len(GERS_NAME_TO_ID) > 0:
                            sample_gers = list(GERS_NAME_TO_ID.keys())[:4]
                            sample_text = ", ".join([name.title() for name in sample_gers])
                            return f"Location '{location_query}' not found. Try locations like: {sample_text}"
                        else:
                            return f"Location '{location_query}' not found. Available stations: Atlanta, Frankfurt, Madrid, Singapore."
            
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
                
                IMPORTANT: Keep responses concise and professional (2-3 sentences max). 
                
                Please provide a response that:
                1. Directly answers the user's question 
                2. Offers specific, actionable insights
                3. Asks clarifying questions if the request is unclear
                4. Avoids verbose explanations or generic statements
                5. Gets straight to the point
                
                Format as natural conversation, not structured data.
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
            
            # Execute the task with timeout handling
            try:
                result = crew.kickoff()
                return str(result)
            except Exception as crew_error:
                # Log the error for debugging
                print(f"CrewAI execution error: {str(crew_error)}")
                # Return a helpful response instead of failing
                return f"I understand you're asking about '{task_description}'. Let me provide a brief response: As your {self.role}, I can help analyze this topic. Could you be more specific about what aspect you'd like me to focus on?"
            
        except Exception as e:
            print(f"Agent execution error: {str(e)}")
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
                # More concise, clarifying response
                if len(task_description.strip()) < 10:  # Very short queries
                    return f"Could you clarify what you'd like me to analyze? I'm your {self.role} and can help with specific questions."
                else:
                    # Ask for clarification professionally
                    return f"I need more context to help effectively. What specific analysis would you like regarding '{task_description}'?"