"""
Unified server for VLM Research Hub.
Serves static files and provides APIs for VLM data, Pruning data, and Contact messages.
Run: python server.py
Then open: http://localhost:8088
"""

import http.server
import json
import csv
import os
from urllib.parse import urlparse
from datetime import datetime

PORT = 8088
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VLM_CSV = os.path.join(BASE_DIR, 'sample_data.csv')
PRUNE_CSV = os.path.join(BASE_DIR, 'pruning_data.csv')
CONTACT_FILE = os.path.join(BASE_DIR, 'contact_messages.json')

# ---- VLM CSV Configuration ----
VLM_FIELDS = [
    'Venue', 'Year', 'Month', 'Day', 'Title',
    'before_encoder', 'Encoder', 'after_encoder', 'text_encoder',
    'Projector', 'after_projector', 'Decoder',
    'Size Params', 'FLOPs', 'No citations',
    'Quality', 'Code', 'CKPT', 'edit', 'Notes',
    'MMMU', 'MathVista', 'VQAv2', 'GQA', 'VizWiz', 'SQA', 'TextVQA',
    'POPE', 'MME', 'MM-Bench', 'MM-Bench-CN', 'SEED-IMG',
    'LLaVA-Bench-Wild', 'MM-Vet'
]

VLM_FIELD_MAP = {
    'Venue': 'venue', 'Year': 'year', 'Month': 'month', 'Day': 'day',
    'Title': 'title',
    'before_encoder': 'before_encoder', 'Encoder': 'encoder',
    'after_encoder': 'after_encoder', 'text_encoder': 'text_encoder',
    'Projector': 'projector', 'after_projector': 'after_projector',
    'Decoder': 'decoder', 'Size Params': 'size_params',
    'FLOPs': 'flops', 'No citations': 'citations', 'Quality': 'quality',
    'Code': 'code', 'CKPT': 'ckpt', 'edit': 'edit', 'Notes': 'notes',
    'MMMU': 'mmmu', 'MathVista': 'mathvista', 'VQAv2': 'vqav2', 'GQA': 'gqa',
    'VizWiz': 'vizwiz', 'SQA': 'sqa', 'TextVQA': 'textvqa', 'POPE': 'pope',
    'MME': 'mme', 'MM-Bench': 'mmbench', 'MM-Bench-CN': 'mmbench_cn',
    'SEED-IMG': 'seed_img', 'LLaVA-Bench-Wild': 'llavabench_wild', 'MM-Vet': 'mmvet'
}

VLM_REVERSE_MAP = {v: k for k, v in VLM_FIELD_MAP.items()}

# ---- Pruning CSV Configuration ----
PRUNE_FIELDS = [
    'Pruning_Method', 'Venue', 'Year', 'Pruning_Location', 'Pruned_Target', 'VLM',
    'edit', 'Token_Retention', 'GQA', 'MMB', 'MM-CN', 'MME', 'POPE', 'SQA', 'VQA_v2',
    'VQA_Text', 'VizWiz', 'FLOPs', 'Inference (ms)', 'GitHub'
]


def read_vlm_csv():
    if not os.path.exists(VLM_CSV):
        return []
    rows = []
    with open(VLM_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            item = {}
            for csv_col, js_key in VLM_FIELD_MAP.items():
                val = row.get(csv_col, '').strip()
                if js_key == 'year':
                    try:
                        val = int(val)
                    except (ValueError, TypeError):
                        val = 2024
                elif js_key == 'day':
                    try:
                        val = int(val) if val else None
                    except (ValueError, TypeError):
                        val = None
                item[js_key] = val
            rows.append(item)
    return rows


def write_vlm_csv(data):
    with open(VLM_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=VLM_FIELDS)
        writer.writeheader()
        for item in data:
            row = {}
            for js_key, csv_col in VLM_REVERSE_MAP.items():
                val = item.get(js_key, '')
                if val is None:
                    val = ''
                row[csv_col] = val
            writer.writerow(row)


def read_prune_csv():
    if not os.path.exists(PRUNE_CSV):
        return []
    rows = []
    with open(PRUNE_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            item = {}
            for field in PRUNE_FIELDS:
                val = row.get(field, '').strip()
                if field == 'Year':
                    try:
                        val = int(val)
                    except (ValueError, TypeError):
                        val = 2024
                item[field] = val
            rows.append(item)
    return rows


def write_prune_csv(data):
    with open(PRUNE_CSV, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=PRUNE_FIELDS)
        writer.writeheader()
        for item in data:
            row = {}
            for field in PRUNE_FIELDS:
                val = item.get(field, '')
                if val is None:
                    val = ''
                row[field] = val
            writer.writerow(row)


def save_contact_message(msg):
    messages = []
    if os.path.exists(CONTACT_FILE):
        with open(CONTACT_FILE, 'r', encoding='utf-8') as f:
            try:
                messages = json.load(f)
            except json.JSONDecodeError:
                messages = []
    messages.append(msg)
    with open(CONTACT_FILE, 'w', encoding='utf-8') as f:
        json.dump(messages, f, indent=2, ensure_ascii=False)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length))

    def do_GET(self):
        path = urlparse(self.path).path

        if path == '/api/vlm':
            self._send_json(read_vlm_csv())
        elif path == '/api/prune':
            self._send_json(read_prune_csv())
        else:
            super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path

        if path == '/api/vlm':
            new_item = self._read_body()
            data = read_vlm_csv()
            data.append(new_item)
            write_vlm_csv(data)
            self._send_json({'status': 'ok', 'count': len(data)})

        elif path == '/api/vlm/save':
            data = self._read_body()
            write_vlm_csv(data)
            self._send_json({'status': 'ok', 'count': len(data)})

        elif path == '/api/prune':
            new_item = self._read_body()
            data = read_prune_csv()
            data.append(new_item)
            write_prune_csv(data)
            self._send_json({'status': 'ok', 'count': len(data)})

        elif path == '/api/prune/save':
            data = self._read_body()
            write_prune_csv(data)
            self._send_json({'status': 'ok', 'count': len(data)})

        elif path == '/api/contact':
            msg = self._read_body()
            save_contact_message(msg)
            self._send_json({'status': 'ok'})

        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")


if __name__ == '__main__':
    print(f"Starting VLM Research Hub server at http://localhost:{PORT}")
    print(f"VLM CSV:     {VLM_CSV}")
    print(f"Pruning CSV: {PRUNE_CSV}")
    print("Press Ctrl+C to stop.\n")
    server = http.server.HTTPServer(('', PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
