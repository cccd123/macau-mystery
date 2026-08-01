"""Drama generation templates"""
TEMPLATES = {
    "suspense": {"name": "悬疑推理", "temperature": 0.8,
        "prompt": "请根据以下描述生成一个悬疑短剧剧本:\n用户描述: {user_input}\n时代背景: {era}\n场景: 澳门历史城区\n要求: 共{acts}幕，每幕2-3个场景，每个场景后有两个选择，至少2个结局，融入澳门真实历史元素，返回JSON格式"},
    "romance": {"name": "爱情故事", "temperature": 0.9,
        "prompt": "请根据以下描述生成一个爱情短剧剧本:\n用户描述: {user_input}\n时代背景: {era}\n场景: 澳门历史城区\n要求: 共{acts}幕，融入中葡文化融合元素，至少2个结局，返回JSON格式"},
    "comedy": {"name": "喜剧冒险", "temperature": 0.95,
        "prompt": "请根据以下描述生成一个喜剧短剧剧本:\n用户描述: {user_input}\n时代背景: {era}\n场景: 澳门历史城区\n要求: 共{acts}幕，误会和反转为主，融入澳门美食和文化元素，返回JSON格式"},
    "tragedy": {"name": "悲剧史诗", "temperature": 0.7,
        "prompt": "请根据以下描述生成一个悲剧短剧剧本:\n用户描述: {user_input}\n时代背景: {era}\n场景: 澳门历史城区\n要求: 共{acts}幕，历史洪流中的个人命运，壮烈而感人的结局，返回JSON格式"},
}

def get_template(style: str) -> dict:
    return TEMPLATES.get(style, TEMPLATES["suspense"])
