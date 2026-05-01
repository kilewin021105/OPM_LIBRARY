import os

from flask import Flask, jsonify, render_template, request

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

try:
    from supabase import create_client
except ImportError:
    create_client = None

if load_dotenv:
    load_dotenv()

app = Flask(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

supabase = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY and create_client:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def get_supabase():
    if not supabase:
        return None, (jsonify({"error": "Supabase not configured"}), 501)
    return supabase, None


def parse_song_payload(payload):
    required = ["title", "artist", "era", "mood"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return None, (
            jsonify({"error": "Missing fields", "fields": missing}),
            400,
        )

    return {
        "title": payload.get("title", "").strip(),
        "artist": payload.get("artist", "").strip(),
        "era": payload.get("era", "").strip(),
        "mood": payload.get("mood", "").strip(),
        "spotify_url": payload.get("spotify_url", "").strip(),
        "image_url": payload.get("image_url", "").strip(),
    }, None


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/songs", methods=["GET"])
def api_songs_list():
    client, error = get_supabase()
    if error:
        return error

    query = request.args.get("q", "").strip()
    table = client.table("songs").select("*")
    if query:
        table = table.or_(f"title.ilike.%{query}%,artist.ilike.%{query}%")

    result = table.order("id", desc=True).limit(100).execute()
    return jsonify(result.data or [])


@app.route("/api/songs", methods=["POST"])
def api_songs_create():
    client, error = get_supabase()
    if error:
        return error

    payload = request.get_json(silent=True) or {}
    song, validation_error = parse_song_payload(payload)
    if validation_error:
        return validation_error

    result = client.table("songs").insert(song).execute()
    return jsonify(result.data[0] if result.data else song), 201


@app.route("/api/songs/<song_id>", methods=["PUT"])
def api_songs_update(song_id):
    client, error = get_supabase()
    if error:
        return error

    payload = request.get_json(silent=True) or {}
    song, validation_error = parse_song_payload(payload)
    if validation_error:
        return validation_error

    result = (
        client.table("songs")
        .update(song)
        .eq("id", song_id)
        .execute()
    )
    return jsonify(result.data[0] if result.data else song)


@app.route("/api/songs/<song_id>", methods=["DELETE"])
def api_songs_delete(song_id):
    client, error = get_supabase()
    if error:
        return error

    client.table("songs").delete().eq("id", song_id).execute()
    return jsonify({"status": "deleted", "id": song_id})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
    # app.run(debug=True)
