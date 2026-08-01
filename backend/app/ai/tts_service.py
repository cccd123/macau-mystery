"""TTS Service - edge-tts"""
import os, uuid, edge_tts

VOICE_OPTIONS = {
    "mage_temple_keeper": "zh-HK-WanLungNeural",
    "lady_fountain_elder": "zh-CN-XiaoxiaoNeural",
    "zheng_house_heir": "zh-CN-YunxiNeural",
    "theater_musician": "zh-CN-YunjianNeural",
    "watchmaker": "zh-CN-YunxiNeural",
}
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "audio")


async def generate_tts(text: str, voice: str = "zh-CN-XiaoxiaoNeural") -> str:
    os.makedirs(AUDIO_DIR, exist_ok=True)
    filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filepath)
    return f"/static/audio/{filename}"


def get_voice_for_npc(npc_id: str) -> str:
    return VOICE_OPTIONS.get(npc_id, "zh-CN-XiaoxiaoNeural")
