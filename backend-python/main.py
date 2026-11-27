from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import uvicorn
from ai_analyzer import analyze_frame, score_audio

app = FastAPI()

latest_score = {"trust_score": 82, "risk": "LOW", "signals": []}
override_active = False

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/api/latest-score")
async def get_latest_score():
    return latest_score

@app.post("/api/set-score")
async def set_score(data: dict):
    global override_active
    new_score = int(data.get("score", 82))
    
    override_active = True if new_score < 70 else False
        
    latest_score["trust_score"] = new_score
    if new_score >= 70: latest_score["risk"] = "LOW"
    elif new_score >= 45: latest_score["risk"] = "SUSPICIOUS"
    else: latest_score["risk"] = "HIGH RISK"
        
    return latest_score

@app.websocket("/ws/analyze")
async def websocket_endpoint(websocket: WebSocket):
    global override_active
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "frame":
                video_result = analyze_frame(message.get("data", ""))
                audio_score, audio_signals = score_audio(message.get("audio", {}))

                # 🟢 FORCE SCORE BASED ON FACES DETECTED
                faces = video_result["faces_detected"]
                
                if faces == 1:
                    final_score = 85  # Force GREEN if a face is seen
                elif faces == 0:
                    final_score = 55  # Force YELLOW if no face is seen
                else:
                    final_score = int(video_result["trust_score"] * 0.7 + audio_score * 0.3) # Normal math
                    
                all_signals = video_result["signals"] + audio_signals

                result = {
                    "trust_score": final_score,
                    "signals": all_signals,
                    "faces_detected": video_result["faces_detected"],
                    "video_score": video_result["trust_score"],
                    "audio_score": audio_score,
                    "classification": video_result["classification"],
                    "class_confidence": video_result["class_confidence"],
                    "debug": video_result["debug"],
                }
                
                # Print to terminal so we can see it's working
                print(f"🧠 Final: {final_score} | V: {video_result['trust_score']} | A: {audio_score} | Faces: {video_result['faces_detected']}")
                
                if not override_active:
                    latest_score["trust_score"] = final_score
                    latest_score["risk"] = (
                        "LOW" if final_score >= 70
                        else "SUSPICIOUS" if final_score >= 45
                        else "HIGH RISK"
                    )
                    latest_score["signals"] = all_signals  
                    
                await websocket.send_text(json.dumps(result))
                
    except WebSocketDisconnect:
        override_active = False 
        latest_score["trust_score"] = 82
        latest_score["risk"] = "LOW"
    except Exception as e:
        print(f"⚠️ Error: {e}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)