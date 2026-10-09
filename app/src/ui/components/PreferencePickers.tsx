// עורכי העדפות שמשותפים למסך ההיכרות ולמסך ההעדפות
import { StyleSheet, View } from "react-native";
import type { NotificationSlot, Preferences, RegionPreference } from "@/domain/preferences";
import { CATEGORIES, type Category } from "@/domain/types";
import { strings } from "../strings";
import { spacing } from "../theme";
import { Chip } from "./Chip";
import { ToggleRow } from "./ToggleRow";

export function InterestsPicker({ value, onChange }: { value: Category[]; onChange: (v: Category[]) => void }) {
  const toggle = (c: Category) => {
    const next = value.includes(c) ? value.filter((x) => x !== c) : [...value, c];
    // שומרים על סדר הקטגוריות הקבוע, ולא מאפשרים רשימה ריקה
    if (next.length) onChange(CATEGORIES.filter((x) => next.includes(x)));
  };
  return (
    <View style={styles.wrap}>
      {CATEGORIES.map((c) => (
        <Chip key={c} label={c} selected={value.includes(c)} onPress={() => toggle(c)} />
      ))}
    </View>
  );
}

const REGIONS: RegionPreference[] = ["il", "world", "both"];

export function RegionPicker({ value, onChange }: { value: RegionPreference; onChange: (v: RegionPreference) => void }) {
  return (
    <View style={styles.wrap}>
      {REGIONS.map((r) => (
        <Chip key={r} label={strings.regions[r]} selected={value === r} onPress={() => onChange(r)} />
      ))}
    </View>
  );
}

const SLOTS: NotificationSlot[] = ["morning", "noon", "evening"];

export function NotificationToggles({
  value,
  onChange,
}: {
  value: Preferences["notifications"];
  onChange: (v: Preferences["notifications"]) => void;
}) {
  return (
    <View style={styles.column}>
      {SLOTS.map((slot) => (
        <ToggleRow
          key={slot}
          label={strings.notifications[slot]}
          value={value[slot]}
          onChange={(on) => onChange({ ...value, [slot]: on })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  column: { gap: spacing.md },
});
