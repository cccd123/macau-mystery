from fastapi import APIRouter
from app.models import ChatRequest, ChatResponse, TtsResponse

router = APIRouter()

NPC_MOCK = {
    "mage_temple_keeper": "后生仔，你问这个啊？这妈阁庙可有年头了，比我爷爷的爷爷还老。当年葡萄牙人第一次来澳门，就是从这庙门口上岸的。",
    "lady_fountain_elder": "喝过亚婆井水，忘不掉澳门——这首民谣你听过吗？我细时候，天天有个后生仔来打水……",
    "zheng_house_heir": "我们家老太爷当年在这写《盛世危言》，主张学西方长技——可到了自家儿女婚事上，规矩比谁都严。",
    "theater_musician": "这剧院啊，中国最老的西式戏院了，当年葡人晚上都爱来这坐坐，看戏、聊天。",
    "watchmaker": "我在这修了四十年表，见过的人比你走过的路还多。那些年的事啊……",
}


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """AI NPC对话 - 当前Mock，后续接入DeepSeek"""
    response = NPC_MOCK.get(req.npc_id, "你好，我是一个NPC。")
    # TODO: from app.ai.llm_client import chat_with_npc
    # response = await chat_with_npc(req.npc_id, req.message, req.context)
    return ChatResponse(response=response)


@router.get("/tts", response_model=TtsResponse)
async def text_to_speech(text: str, voice: str = "zh-CN-XiaoxiaoNeural"):
    """TTS语音合成 - 当前Mock，后续接入edge-tts"""
    # TODO: from app.ai.tts_service import generate_tts
    return TtsResponse(audio_url="", text=text)
