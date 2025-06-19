#include <iostream>
#include <string>
#include <cstdlib>
#include <fstream>
#include <sstream>

// Simple HTTP server to serve the JSON data
int main() {
    std::cout << "Starting Currency Arbitrage Server..." << std::endl;
    
    // Compile the arbitrage detector
    system("g++ -o arbitrage arbitrage.cpp");
    
    // Run the arbitrage detector to generate data.json
    system("arbitrage.exe");

    
    // Set up a simple HTTP server using Python
    std::ofstream serverScript("server.py");
    serverScript << "import http.server\n";
    serverScript << "import socketserver\n";
    serverScript << "import json\n\n";
    serverScript << "PORT = 8000\n\n";
    serverScript << "class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):\n";
    serverScript << "    def end_headers(self):\n";
    serverScript << "        self.send_header('Access-Control-Allow-Origin', '*')\n";
    serverScript << "        self.send_header('Access-Control-Allow-Methods', 'GET')\n";
    serverScript << "        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')\n";
    serverScript << "        return super().end_headers()\n\n";
    serverScript << "    def do_GET(self):\n";
    serverScript << "        if self.path == '/api/data':\n";
    serverScript << "            self.send_response(200)\n";
    serverScript << "            self.send_header('Content-type', 'application/json')\n";
    serverScript << "            self.end_headers()\n";
    serverScript << "            with open('data.json', 'rb') as file:\n";
    serverScript << "                self.wfile.write(file.read())\n";
    serverScript << "        elif self.path == '/api/update':\n";
    serverScript << "            import subprocess\n";
    serverScript << "            subprocess.run(['./arbitrage'])\n";
    serverScript << "            self.send_response(200)\n";
    serverScript << "            self.send_header('Content-type', 'application/json')\n";
    serverScript << "            self.end_headers()\n";
    serverScript << "            self.wfile.write(json.dumps({'status': 'updated'}).encode())\n";
    serverScript << "        else:\n";
    serverScript << "            return super().do_GET()\n\n";
    serverScript << "Handler = CORSHTTPRequestHandler\n\n";
    serverScript << "with socketserver.TCPServer(('', PORT), Handler) as httpd:\n";
    serverScript << "    print('Serving at port', PORT)\n";
    serverScript << "    httpd.serve_forever()\n";
    serverScript.close();
    
    std::cout << "Server script created. Run with 'python server.py'" << std::endl;
    std::cout << "Then open index.html in your browser" << std::endl;
    
return 0;
}