import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Redirect DB and file paths to /tmp for Vercel
os.environ['VERCEL'] = '1'

from MIS.MISBACKEND import app
from mangum import Mangum

handler = Mangum(app)
