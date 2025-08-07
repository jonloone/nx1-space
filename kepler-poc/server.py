#!/usr/bin/env python3
"""
Simple HTTP server for Ground Station Intelligence App
Serves the React development files directly
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse
import json

PORT = 8080
DIRECTORY = "."

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Set appropriate content types
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        elif self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json')
        elif self.path.endswith('.css'):
            self.send_header('Content-Type', 'text/css')
            
        super().end_headers()
    
    def do_GET(self):
        # Serve index.html for all routes (React routing)
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/' or not os.path.exists(self.translate_path(self.path)):
            self.path = '/public/index.html'
        
        return super().do_GET()

def get_ip_address():
    """Get the server's IP address"""
    import socket
    hostname = socket.gethostname()
    try:
        # Try to get external IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        # Fallback to localhost
        return "127.0.0.1"

if __name__ == "__main__":
    Handler = CustomHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        ip_address = get_ip_address()
        print(f"\n🚀 Ground Station Intelligence Server")
        print(f"==================================")
        print(f"Server running on:")
        print(f"  Local:    http://localhost:{PORT}")
        print(f"  Network:  http://{ip_address}:{PORT}")
        print(f"  All IPs:  http://0.0.0.0:{PORT}")
        print(f"\nPress Ctrl+C to stop the server\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            sys.exit(0)