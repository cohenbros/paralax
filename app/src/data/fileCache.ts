import { File, Paths } from "expo-file-system";

// קבצים בתיקיית המסמכים של האפליקציה (לא נמחקים אוטומטית, כדי שהפיד יעבוד גם בלי אינטרנט)
function file(name: string): File {
  return new File(Paths.document, name);
}

export async function readCache(name: string): Promise<string | null> {
  try {
    const f = file(name);
    return f.exists ? await f.text() : null;
  } catch {
    return null;
  }
}

export function writeCache(name: string, content: string): void {
  const f = file(name);
  if (!f.exists) f.create();
  f.write(content);
}
