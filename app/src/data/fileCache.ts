import { File, Paths } from "expo-file-system";

// קבצים בתיקיית המסמכים של האפליקציה (לא נמחקים אוטומטית, כדי שהפיד יעבוד גם בלי אינטרנט).
// המטמון הוא "best effort": כשל בקריאה או בכתיבה (אחסון מלא, תצוגה בדפדפן) לא מפיל את טעינת החדשות.
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
  try {
    const f = file(name);
    if (!f.exists) f.create();
    f.write(content);
  } catch {
    // בלי עותק מקומי האפליקציה עדיין עובדת, רק לא בלי אינטרנט
  }
}
