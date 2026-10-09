// הגדרות קבועות של האפליקציה. קובץ בלי תלויות, מותר לייבא אותו מכל שכבה.
// כתובת הנתונים שהאוסף מפרסם (GitHub Pages, ראו .github/workflows/collect.yml)
export const DATA_BASE_URL = "https://cohenbros.github.io/paralax/data";
export const LATEST_URL = `${DATA_BASE_URL}/latest.json`;
export const SOURCES_URL = `${DATA_BASE_URL}/sources.json`;

export const REQUEST_TIMEOUT_MS = 15_000;
export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
// חזרה לחזית בתוך הזמן הזה לא מורידה שוב
export const MIN_REFRESH_INTERVAL_MS = 60_000;

export const CONTACT_URL = "https://github.com/cohenbros/paralax/issues";

// "דווח על טעות": issue חדש במאגר, עם פרטי הידיעה ממולאים מראש
export const REPORT_ISSUE_URL = "https://github.com/cohenbros/paralax/issues/new";
