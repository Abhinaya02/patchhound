# apaconfig.py
import os

# Swarm default limits
MAX_ITERATIONS = 4
RETRY_LIMIT = 3
BACKOFF_BASE_SECONDS = 2
SLA_TARGET_HOURS = 2.0

# Supported Models
MODEL_PROVIDERS = ["Gemini", "Groq", "LocalSimulation"]

PRIMARY_MODEL_NAME = "gemini-2.5-flash"
SECONDARY_MODEL_NAME = "gemini-2.5-pro"
BACKUP_MODEL_NAME = "llama-3.3-70b-versatile"

# Active Model selection
ACTIVE_PROVIDER = os.getenv("ACTIVE_PROVIDER", "LocalSimulation")
ACTIVE_MODEL = os.getenv("ACTIVE_MODEL", PRIMARY_MODEL_NAME)

# Network isolation settings (NetworkDisabled WSB policy)
NETWORK_ISOLATION_ENABLED = True  # Default to high isolated security for sandbox execution

def sanitize_code_payload(code_str: str) -> str:
    """
    Ensures no proprietary credentials, local file system absolute paths, 
    or license keys are leaked to external LLM providers.
    """
    sensitive_keywords = ["key", "password", "secret", "token", "license", "private_key", "/home/", "/Users/"]
    lines = code_str.split("\n")
    sanitized_lines = []
    for line in lines:
        lower_line = line.lower()
        if any(kw in lower_line for kw in sensitive_keywords) and ("const" in lower_line or "=" in lower_line or "import" in lower_line):
            sanitized_lines.append("# [REDACTED SENSITIVE CONFIGURATION LINE BY APACONFIG]")
        else:
            sanitized_lines.append(line)
    return "\n".join(sanitized_lines)
