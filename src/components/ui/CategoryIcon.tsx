import { Axe, BatteryCharging, Drill, Droplets, Hammer, Sprout, Wrench, Zap, type LucideProps } from "lucide-react";
import type { CategoryIcon as IconKey } from "@/types";

const ICONS: Record<IconKey, React.ComponentType<LucideProps>> = {
  generator: Zap,
  drill: Drill,
  trimmer: Sprout,
  battery: BatteryCharging,
  washer: Droplets,
  hammer: Hammer,
  chainsaw: Axe,
};

export function CategoryIcon({ icon, ...props }: { icon: IconKey } & LucideProps) {
  const Icon = ICONS[icon] ?? Wrench;
  return <Icon {...props} />;
}
