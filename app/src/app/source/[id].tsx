import { useLocalSearchParams } from "expo-router";
import { SourceScreen } from "@/ui/screens/SourceScreen";

export default function SourceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SourceScreen id={id} />;
}
