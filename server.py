import http.server
import socketserver
import json

PORT = 8000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super().end_headers()

    def do_GET(self):
        if self.path == '/api/data':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            with open('data.json', 'rb') as file:
                self.wfile.write(file.read())
        elif self.path == '/api/update':
            import subprocess
            subprocess.run(['./arbitrage'])
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'updated'}).encode())
        else:
            return super().do_GET()

Handler = CORSHTTPRequestHandler

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print('Serving at port', PORT)
    httpd.serve_forever()
