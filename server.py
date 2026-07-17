#!/usr/bin/env python3
"""上海买房地图 · 本地轻服务：发静态页面 + 接收收藏档案写入（原子写）。仅本机运行。"""
import http.server, socketserver, json, os, tempfile

ROOT = os.path.dirname(os.path.abspath(__file__))
PROFILES = os.path.join(ROOT, "data", "profiles.json")
PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_POST(self):
        if self.path != "/api/profiles":
            self.send_error(404); return
        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self.send_error(400, "bad json"); return
        # 原子写：先写临时文件，再替换，避免写一半损坏
        fd, tmp = tempfile.mkstemp(dir=os.path.dirname(PROFILES))
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
            os.replace(tmp, PROFILES)
        except Exception:
            if os.path.exists(tmp): os.remove(tmp)
            self.send_error(500, "write failed"); return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')

    def log_message(self, *a):  # 静默常规日志
        pass

if __name__ == "__main__":
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"上海买房地图运行中：http://localhost:{PORT}  (Ctrl+C 停止)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n已停止。")
