# MongoDB collection names and example document structures

FACES_COLLECTION = "faces"
LOGS_COLLECTION = "logs"

# Example face document:
# {
#   "personId": str,
#   "image_url": str,
#   "embedding": list[float],
# }

# Example log document:
# {
#   "personId": str,
#   "timestamp": str,
#   "success": bool,
# } 