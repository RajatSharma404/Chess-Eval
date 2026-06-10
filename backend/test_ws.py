import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws/analyze"
    async with websockets.connect(uri) as websocket:
        await websocket.send(json.dumps({"game_url": "[Event \"Live Chess\"]\n[Site \"Chess.com\"]\n\n1. d4"}))
        try:
            while True:
                response = await websocket.recv()
                print(f"Received: {response}")
        except websockets.exceptions.ConnectionClosed as e:
            print(f"Connection closed: {e.code} {e.reason}")

asyncio.run(test_ws())
