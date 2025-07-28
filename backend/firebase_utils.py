import firebase_admin
import os
from firebase_admin import credentials

sdk_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
cred = credentials.Certificate(sdk_path)
firebase_admin.initialize_app(cred)
