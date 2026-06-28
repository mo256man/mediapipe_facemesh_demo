isMediaPipeAvailable = True

import os
import threading
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
import cv2
import time
from flask_socketio import SocketIO
from myCamera import Camera
from myDatabase import insert_camera_row, get_camera_records, delete_record

# グローバル終了フラグ
stop_flag = threading.Event()

app = Flask(__name__)
app.config["SECRET_KEY"] = "vendor_camera_secret"

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'output'))

# CORSを設定：すべてのオリジンからのリクエスト、すべてのメソッド、すべてのヘッダーを許可
CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading", ping_timeout=60, ping_interval=25)

class Config:
  """アプリケーション設定管理"""
  def __init__(self):
    self.is_ai_available = isMediaPipeAvailable
    self.ready_record = False
    self._is_recording = False
    self.is_manual_recording = False
    self.is_running = False
    self.previous_recording = False
    self.on_recording_change = None
    self.clear_recording_state()

  @property
  def is_recording(self):
    return self._is_recording

  @is_recording.setter
  def is_recording(self, value):
    if self._is_recording != value:
      self._is_recording = value
      if self.on_recording_change:
        self.on_recording_change(value)
  
  def clear_recording_state(self):
    self.record_start_dt = None
    self.record_fps = None
    self.record_writer = None
    self.next_write_time = None
    self.tick = None
    self.record_out_w = None
    self.record_out_h = None
    self.record_start_dt = None
    self.record_fps = None
    self.record_writer = None
    self.next_write_time = None
    self.tick = None
    self.record_out_w = None
    self.record_out_h = None

config = Config()
camera = Camera(config)

def _on_recording_change(value):
  """is_recording変化時にWebSocketで通知"""
  socketio.emit('status_update', {'is_recording': value})

config.on_recording_change = _on_recording_change


def _generate_frames():
  """MJPEG フレームをジェネレータで垂れ流す"""
  while not stop_flag.is_set():
    frame = camera.get_frame()
    if frame is None:
      time.sleep(0.02)
      continue
      
    ret, buffer = cv2.imencode(".jpg", frame)
    if not ret:
      continue
      
    yield (
      b"--frame\r\n"
      b"Content-Type: image/jpeg\r\n\r\n"
      + buffer.tobytes()
      + b"\r\n"
    )


@app.route("/api/video_feed")
def video_feed():
  """MJPEG ビデオフィード配信"""
  return Response(
    _generate_frames(),
    mimetype="multipart/x-mixed-replace; boundary=frame"
  )


@app.route("/api/get_camera", methods=["GET"])
def get_camera():
  """現在のカメラIDを取得"""
  return jsonify({"camera_id": camera.camera_id})


@app.route("/api/get_status", methods=["GET"])
def get_status():
  """現在のサーバー状態をまとめて取得"""
  return jsonify({
    "camera_id": camera.camera_id,
    "is_running": config.is_running,
    "is_recording": config.is_recording,
    "ready_record": config.ready_record,
  })


@app.route("/api/set_camera", methods=["POST"])
def set_camera():
  """カメラを切り替え"""
  data = request.get_json()
  camera_id = data.get("camera_id")
  print(f"[POST /api/set_camera] Setting camera_id to {camera_id}")
  
  # camera_id=0（停止）は常に実行してカメラを確実に解放する
  if camera_id == 0:
    camera.initialize(0)
    print(f"[POST /api/set_camera] Camera stopped and released.")
    return jsonify({"status": "success", "camera_id": 0})

  # 同じカメラIDなら再初期化をスキップ（ランプの点滅を防ぐ）
  if camera.camera_id == camera_id:
    print(f"[POST /api/set_camera] Camera {camera_id} is already initialized. Skipping.")
    return jsonify({"status": "success", "camera_id": camera_id, "already_initialized": True})
  
  try:
    camera.initialize(camera_id)
    print(f"[POST /api/set_camera] Success. camera.camera_id is now {camera.camera_id}")
    socketio.emit('status_update', {'is_recording': config.is_recording, 'camera_id': camera.camera_id, 'is_running': config.is_running, 'ready_record': config.ready_record})
    return jsonify({"status": "success", "camera_id": camera_id})
  except Exception as e:
    print(f"[POST /api/set_camera] Error: {e}")
    return jsonify({"status": "error", "message": str(e)}), 400
  

@app.route("/output/<path:filename>")
def serve_output(filename):
  """outputフォルダの静的ファイルを配信"""
  return send_from_directory(OUTPUT_DIR, filename)


@app.route("/api/get_records", methods=["POST"])
def get_records():
  """録画記録を取得"""
  data = request.get_json()
  dt_str = data.get("date", "")
  records = get_camera_records(dt_str)
  return jsonify({"records": records})


@app.route("/api/delete_record", methods=["POST"])
def del_record():
  """録画記録を削除"""
  data = request.get_json()
  filename = data.get("filename")
  delete_record(filename)
  return jsonify({"status": "success"})


@app.route("/api/set_running", methods=["POST"])
def set_running():
  """isRunningの状態を設定"""
  data = request.get_json()
  is_running = data.get("running")
  print(f"[POST /api/set_running] Setting is_running to {is_running}")
  config.is_running = is_running
  socketio.emit('status_update', {'is_recording': config.is_recording, 'is_running': config.is_running, 'ready_record': config.ready_record})
  return jsonify({"status": "success", "is_running": is_running})


@app.route("/api/set_config", methods=["POST"])
def set_config():
  """Configの各属性を設定"""
  data = request.get_json()
  if "ready_record" in data:
    config.ready_record = data["ready_record"]
    print(f"[POST /api/set_config] ready_record = {config.ready_record}")
    socketio.emit('status_update', {'ready_record': config.ready_record})
  if "is_manual_recording" in data:
    config.is_manual_recording = data["is_manual_recording"]
    print(f"[POST /api/set_config] is_manual_recording = {config.is_manual_recording}")
  return jsonify({"status": "success"})


if __name__ == "__main__":
  print(app.url_map)
  try:
    socketio.run(app, host="0.0.0.0", port=5000, debug=False, allow_unsafe_werkzeug=True)
  except (KeyboardInterrupt, SystemExit):
    pass
  finally:
    print("\n[APP] Shutting down...", flush=True)
    os._exit(0)