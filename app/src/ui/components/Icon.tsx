import { Ionicons } from "@expo/vector-icons";
import type { IconName } from "../signalText";

type Props = { name: IconName; size?: number; color: string };

// אייקונים דקורטיביים: מוסתרים מקורא המסך, הטקסט שלידם נושא את המשמעות
export function Icon({ name, size = 16, color }: Props) {
  return <Ionicons name={name} size={size} color={color} accessible={false} importantForAccessibility="no" />;
}
