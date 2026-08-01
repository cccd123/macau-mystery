"""RAG Engine - Retrieval Augmented Generation"""

async def rag_query(query: str, location: str = "") -> list[str]:
    """检索澳门历史知识 - TODO: 接入ChromaDB"""
    mock = {
        "妈阁庙": "妈阁庙是澳门现存最古老的庙宇之一，建于明代。葡萄牙人将'妈阁'听作'Macau'。",
        "亚婆井前地": "亚婆井前地是葡萄牙人在澳门最早的聚居点之一。明代老婆婆修水池贮存山泉。",
        "郑家大屋": "郑家大屋是晚清思想家郑观应故居，郑观应在此写就《盛世危言》。",
        "岗顶剧院": "岗顶剧院建于1860年，是中国现存最古老的西式剧院。",
    }
    results = [v for k, v in mock.items() if k in query or k in location]
    return results if results else ["未找到相关历史知识"]
