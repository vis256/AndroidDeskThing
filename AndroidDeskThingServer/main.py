import asyncio
import websockets
import json
import socket
import aiohttp  # Add this import
from aiohttp import web
from winrt.windows.media.control import (GlobalSystemMediaTransportControlsSessionManager)
from winrt.windows.storage.streams import (
    DataReader, Buffer, InputStreamOptions, IRandomAccessStreamReference
)
from io import BytesIO
from PIL import Image
import base64  # Add this import

# List to store connected WebSocket clients
connected_clients = set()
manager = None

album_art_cache = {}

#region Media Control
async def get_album_art(artist, title, thumbnail_ref):
    cache_key = f"{artist}-{title}"
    if cache_key in album_art_cache:
        return album_art_cache[cache_key]

    thumb_read_buffer = Buffer(5000000)
    readable_stream = await thumbnail_ref.open_read_async()
    await readable_stream.read_async(thumb_read_buffer, thumb_read_buffer.capacity, InputStreamOptions.READ_AHEAD)

    buffer_reader = DataReader.from_buffer(thumb_read_buffer)
    byte_buffer = buffer_reader.read_buffer(buffer_reader.unconsumed_buffer_length)
    bytes = bytearray(byte_buffer)

    # Convert bytes to image
    image = Image.open(BytesIO(bytes))
    image_bytes = BytesIO()
    image.save(image_bytes, format='PNG')
    image_bytes = image_bytes.getvalue()

    # Encode image in base64
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')

    # Save it to cache
    album_art_cache[cache_key] = image_base64
    return image_base64

async def get_media_info():
    global manager
    manager = await GlobalSystemMediaTransportControlsSessionManager.request_async()
    
    try:
        current_session = manager.get_current_session()
        if (current_session):
            media_properties = await current_session.try_get_media_properties_async()
            if (media_properties):
                media_info = {song_attr: media_properties.__getattribute__(song_attr) for song_attr in dir(media_properties) if song_attr[0] != '_'}
                album_art = await get_album_art(media_info["artist"], media_info["title"], media_properties.thumbnail)
               
                return {
                    "Artist": media_info["artist"],
                    "Title": media_info["title"],
                    "Playing": current_session.get_playback_info().playback_status == 4,
                    "AlbumArt": album_art
                }
    except Exception as e:
        print(f"Error accessing media session: {e}")
    return None

async def handle_message(message):
    if message == "pause":
        asyncio.create_task(pause_media())
    elif message == "play":
        asyncio.create_task(resume_media())
    elif message == "next":
        asyncio.create_task(next_media())
    elif message == "previous":
        asyncio.create_task(previous_media())

async def resume_media():
    global manager
    try:
        current_session = manager.get_current_session()
        if (current_session):
            await current_session.try_play_async()
    except Exception as e:
        print(f"Error resuming media: {e}")

async def pause_media():
    global manager
    try:
        current_session = manager.get_current_session()
        if (current_session):
            await current_session.try_pause_async()
    except Exception as e:
        print(f"Error pausing media: {e}")

async def next_media():
    global manager
    try:
        current_session = manager.get_current_session()
        if (current_session):
            await current_session.try_skip_next_async()
    except Exception as e:
        print(f"Error skipping to next media: {e}")

async def previous_media():
    global manager
    try:
        current_session = manager.get_current_session()
        if (current_session):
            await current_session.try_skip_previous_async()
    except Exception as e:
        print(f"Error skipping to previous media: {e}")
        

#endregion

#region WebSocket Server
async def send_periodic_messages():
    """Send a message to all connected WebSocket clients every second."""
    while True:
        if connected_clients:
            media_info = await get_media_info()
            if (media_info):
                message = json.dumps(media_info)
                await asyncio.gather(*[asyncio.create_task(client.send(message)) for client in connected_clients])
            else:
                await asyncio.gather(*[asyncio.create_task(client.send("No media playing")) for client in connected_clients])

        await asyncio.sleep(1)

async def handle_websocket(websocket):
    """Handle a new WebSocket client connection."""
    connected_clients.add(websocket)
    print("Client connected")

    try:
        async for message in websocket:
            print(f"Received: {message}")
            await handle_message(message)
    except websockets.ConnectionClosed:
        print("Client disconnected")
    finally:
        connected_clients.remove(websocket)
#endregion

async def handle_http(request):
    """Handle an HTTP GET request."""
    return web.Response(
        text="This is an HTTP response from the server so it knows that AndroidDeskThingServer is running on this computer.",
        content_type="text/plain"
    )

HTTP_PORT = 5991
WEBSOCKET_PORT = 5992

def get_local_ip():
    """Get the local IP address in the 192.168.x.x range."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('192.168.1.1', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

async def main():
    # Get the local IP address
    local_ip = get_local_ip()
    print(f"Local IP address: {local_ip}")

    # Start the WebSocket server
    websocket_server = await websockets.serve(handle_websocket, "0.0.0.0", WEBSOCKET_PORT)
    print(f"WebSocket server started on ws://0.0.0.0:{WEBSOCKET_PORT}")

    # Start the HTTP server
    app = web.Application()
    app.router.add_get("/", handle_http)
    http_server = asyncio.create_task(web._run_app(app, port=HTTP_PORT, host="0.0.0.0", handle_signals=False))
    print(f"HTTP server started on http://0.0.0.0:{HTTP_PORT}")

    # Create a task for sending periodic messages
    periodic_messages_task = asyncio.create_task(send_periodic_messages())

    # Run WebSocket and HTTP servers concurrently
    await asyncio.gather(websocket_server.wait_closed(), http_server, periodic_messages_task)

# Run the event loop
if __name__ == "__main__":
    asyncio.run(main())
