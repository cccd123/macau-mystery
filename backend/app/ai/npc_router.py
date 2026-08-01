"""NPC Router - Routes to correct NPC persona"""
NPC_PERSONAS = {
    "mage_temple_keeper": {"name": "妈阁庙看庙老伯", "location": "妈阁庙", "voice": "zh-HK-WanLungNeural"},
    "lady_fountain_elder": {"name": "亚婆井阿婆", "location": "亚婆井前地", "voice": "zh-CN-XiaoxiaoNeural"},
    "zheng_house_heir": {"name": "郑家大屋老管家后人", "location": "郑家大屋", "voice": "zh-CN-YunxiNeural"},
    "theater_musician": {"name": "岗顶剧院老乐师", "location": "岗顶剧院", "voice": "zh-CN-YunjianNeural"},
    "watchmaker": {"name": "议事亭前地修表匠", "location": "议事亭前地", "voice": "zh-CN-YunxiNeural"},
}

def get_npc_for_location(location: str) -> str | None:
    for npc_id, info in NPC_PERSONAS.items():
        if info["location"] == location:
            return npc_id
    return None

def get_npc_info(npc_id: str) -> dict | None:
    return NPC_PERSONAS.get(npc_id)
