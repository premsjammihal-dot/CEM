import hero from "./hero.jpg";
import hackathon from "./posters/hackathon.jpg";
import cultural from "./posters/cultural.jpg";
import robotics from "./posters/robotics.jpg";
import music from "./posters/music.jpg";
import sports from "./posters/sports.jpg";
import workshop from "./posters/workshop.jpg";

export const HERO_IMG = hero;

export const IMAGE_POSTERS: Record<string, string> = {
  hackathon,
  cultural,
  robotics,
  music,
  sports,
  workshop,
};

export const GRADIENT_POSTERS: Record<string, { cls: string; label: string }> = {
  aurora: { cls: "from-violet-600 via-purple-700 to-indigo-900", label: "Aurora Violet" },
  cyberspace: { cls: "from-cyan-500 via-sky-700 to-blue-950", label: "Cyber Cyan" },
  ember: { cls: "from-rose-500 via-red-700 to-orange-950", label: "Ember Rose" },
  matrix: { cls: "from-emerald-500 via-teal-700 to-cyan-950", label: "Matrix Green" },
  solar: { cls: "from-amber-400 via-orange-600 to-rose-900", label: "Solar Flare" },
  midnight: { cls: "from-indigo-500 via-slate-800 to-slate-950", label: "Midnight Grid" },
};

export const POSTER_OPTIONS = [
  ...Object.keys(IMAGE_POSTERS).map((k) => ({ value: `img:${k}`, label: `${k[0].toUpperCase()}${k.slice(1)} (artwork)` })),
  ...Object.entries(GRADIENT_POSTERS).map(([k, v]) => ({ value: `grad:${k}`, label: `${v.label} (gradient)` })),
];

export type PosterRef = { kind: "img"; src: string } | { kind: "grad"; cls: string };

export function resolvePoster(poster: string): PosterRef {
  const [type, key] = poster.split(":");
  if (type === "img" && IMAGE_POSTERS[key]) return { kind: "img", src: IMAGE_POSTERS[key] };
  if (type === "grad" && GRADIENT_POSTERS[key]) return { kind: "grad", cls: GRADIENT_POSTERS[key].cls };
  return { kind: "grad", cls: GRADIENT_POSTERS.aurora.cls };
}

export const EVENT_CATEGORIES = [
  "Technical",
  "Hackathon",
  "Cultural",
  "Music",
  "Sports",
  "Workshop",
  "Gaming",
  "Seminar",
] as const;

export const CATEGORY_STYLE: Record<string, string> = {
  Technical: "text-cyan-300 bg-cyan-500/10 border-cyan-400/25",
  Hackathon: "text-violet-300 bg-violet-500/10 border-violet-400/25",
  Cultural: "text-rose-300 bg-rose-500/10 border-rose-400/25",
  Music: "text-pink-300 bg-pink-500/10 border-pink-400/25",
  Sports: "text-emerald-300 bg-emerald-500/10 border-emerald-400/25",
  Workshop: "text-amber-300 bg-amber-500/10 border-amber-400/25",
  Gaming: "text-indigo-300 bg-indigo-500/10 border-indigo-400/25",
  Seminar: "text-sky-300 bg-sky-500/10 border-sky-400/25",
};
