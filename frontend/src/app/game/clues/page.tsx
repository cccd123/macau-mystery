import { ClueCard } from "@/components/clue-card";

const MOCK_CLUES = [
  {
    id: "clue_01",
    title: "信封内页残字",
    description: "“某年春，自妈阁启程”",
    location: "妈阁庙",
    collected: true,
    icon: "✉️",
  },
  {
    id: "clue_02",
    title: "姑娘姓氏线索",
    description: "“姓……住在山下一户做生意的人家”",
    location: "亚婆井前地",
    collected: true,
    icon: "📜",
  },
  {
    id: "clue_03",
    title: "被撕去一半的合影",
    description: "背面写着一个剧院的名字",
    location: "郑家大屋",
    collected: false,
    icon: "📷",
  },
  {
    id: "clue_04",
    title: "剧院节目单",
    description: "未知",
    location: "岗顶剧院",
    collected: false,
    icon: "🎭",
  },
  {
    id: "clue_05",
    title: "修表匠的证词",
    description: "未知",
    location: "议事亭前地",
    collected: false,
    icon: "⏰",
  },
];

export default function CluesPage() {
  const collected = MOCK_CLUES.filter((c) => c.collected);
  const locked = MOCK_CLUES.filter((c) => !c.collected);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">线索背包</h1>
      <p className="text-muted-foreground mb-6">
        已收集 {collected.length}/{MOCK_CLUES.length} 个线索
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {collected.map((clue) => (
          <ClueCard key={clue.id} {...clue} />
        ))}
        {locked.map((clue) => (
          <ClueCard key={clue.id} {...clue} />
        ))}
      </div>
    </div>
  );
}
