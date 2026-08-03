import Image from "next/image";

const SCENE_IMAGES = [
  {
    aliases: ["妈阁庙", "媽閣廟", "a-ma temple", "a ma temple", "barra temple"],
    src: "/images/scenes/a-ma-temple.png",
  },
  {
    aliases: ["亚婆井前地", "亞婆井前地", "lilau square"],
    src: "/images/scenes/lilau-square.png",
  },
  {
    aliases: ["郑家大屋", "鄭家大屋", "mandarin's house", "mandarins house"],
    src: "/images/scenes/mandarins-house.png",
  },
  {
    aliases: ["岗顶剧院", "崗頂劇院", "dom pedro v theatre", "dom pedro v theater"],
    src: "/images/scenes/dom-pedro-v-theatre.png",
  },
  {
    aliases: ["议事亭前地", "議事亭前地", "senado square"],
    src: "/images/scenes/senado-square.png",
  },
  {
    aliases: ["大三巴牌坊", "ruins of st. paul's", "ruins of st pauls"],
    src: "/images/scenes/ruins-of-st-pauls.png",
  },
] as const;

function imageForLocation(location: string) {
  const normalized = location.trim().toLocaleLowerCase();
  return (
    SCENE_IMAGES.find(({ aliases }) =>
      aliases.some((alias) => normalized.includes(alias))
    )?.src ?? SCENE_IMAGES[0].src
  );
}

interface SceneIllustrationProps {
  location: string;
  sceneKey: string;
  alt: string;
}

export function SceneIllustration({
  location,
  sceneKey,
  alt,
}: SceneIllustrationProps) {
  return (
    <figure
      key={sceneKey}
      className="scene-reveal relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#08282a] shadow-[0_28px_70px_-30px_rgba(3,22,23,0.85)] lg:aspect-[16/11]"
    >
      <Image
        src={imageForLocation(location)}
        alt={alt}
        fill
        priority
        sizes="(min-width: 1024px) 62vw, 100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(4,23,24,0.82)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--brass)]/70 to-transparent"
      />
    </figure>
  );
}
