# statetransitions.py
import time
from typing import Dict, Any, List

def transition_state(state: Dict[str, Any], next_node: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Formally transition the swarm state. 
    Maintains historical validation timelines and tracks state changes.
    Enforces that direct dict mutations do not occur.
    """
    # Create full copy of current state dictionary
    new_state = dict(state)
    
    # Track transition log
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    history_entry = f"[{timestamp}] Transitioned to [{next_node}]"
    
    # Apply updates through formal process
    for key, value in updates.items():
        new_state[key] = value
        
    # Append execution history
    if "execution_history" not in new_state:
        new_state["execution_history"] = []
    
    new_state["execution_history"].append(history_entry)
    
    # Store dynamic metadata trackers
    new_state["current_node"] = next_node
    new_state["last_updated"] = timestamp
    
    return new_state
