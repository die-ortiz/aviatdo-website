import http.server
import socketserver
import functools
import os

DIRECTORY = "/Users/diego/Documents/04-ICORPORATE/auditorias web/aviatdo/website/code/aviatdo-export"
PORT = int(os.environ.get("PORT", 8899))

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIRECTORY)

with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    httpd.serve_forever()
