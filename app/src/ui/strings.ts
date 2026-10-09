// כל הטקסטים של הממשק במקום אחד

export const strings = {
  appName: "פרלקס",
  settingsTitle: "העדפות",

  feed: {
    endOfFeed: "סיימת לעכשיו",
    endOfFeedHint: "הפיד מתעדכן בערך כל חצי שעה. משכו למטה לרענון.",
    updatedAt: (t: string) => `עודכן ${t}`,
    empty: "אין ידיעות שמתאימות לבחירה שלך כרגע.",
    loading: "טוענים את החדשות…",
    loadFailed: "לא הצלחנו להוריד את החדשות. בדקו את החיבור ונסו שוב.",
    offline: "אין חיבור. מוצג העדכון האחרון שנשמר.",
    retry: "נסו שוב",
  },

  story: {
    notFound: "הידיעה כבר לא זמינה. ייתכן שעברו יותר מ-48 שעות.",
    signals: "כמה אפשר לסמוך על זה?",
    leanPending: "נטיית הקהל של המקורות עדיין נבדקת, ולכן פס הקשת עוד לא מוצג.",
    howTheyWrote: "איך כתבו על זה",
    howTheyWroteHint: "הנקודה הצבעונית: נטיית הקהל של המקור. תגובות הגולשים נמצאות בתחתית כל כתבה באתר המקור.",
    readFull: "לכתבה ולתגובות הגולשים",
    sourceProfile: "פרופיל המקור",
    reportError: "דווח על טעות",
    perspectives: "נקודות מבט",
    noPerspectives: "עדיין לא נמצאו ציטוטים של דמויות ציבוריות על האירוע.",
    oneSidedPerspectives: "עדיין לא נמצאו תגובות מכיוונים נוספים.",
    via: (source: string) => (source ? `דרך ${source}` : ""),
    reflection: "מה חסר כאן כדי להחליט?",
    copyrightNote: "מוצגים כותרת ותקציר קצר בלבד. הכתבה המלאה באתר המקור.",
  },

  lean: { right: "ימין", center: "מרכז", left: "שמאל", unknown: "לא נבדק" },

  ask: {
    title: "רוצה להבין יותר?",
    hint: "בחרו שאלה. היא תיפתח עם הכותרת והקישור באפליקציה שתבחרו, למשל Gemini.",
    questions: ["מה הרקע לאירוע?", "מה טוען כל צד?", "מה עדיין לא ידוע?", "איך זה משפיע עליי?"],
  },

  source: {
    notFound: "המקור לא נמצא.",
    site: "אתר",
    owner: "בעלות",
    funding: "מימון",
    pressCouncil: "חבר במועצת העיתונות",
    corrections: "מדיניות תיקונים",
    ifcn: "חתום על קוד העקרונות של IFCN",
    audienceLean: "נטיית קהל",
    evidence: "מקורות למידע",
    unknown: "עדיין לא נבדק",
    yes: "כן",
    no: "לא",
    note: "המידע כאן הוא עובדות עם קישור לראיה. אנחנו לא מדרגים כלי תקשורת כאמינים או לא אמינים.",
  },

  onboarding: {
    welcome: "ברוכים הבאים לפרלקס",
    intro: "חדשות מהארץ ומהעולם, עם סימני אמינות שקופים והשוואה בין כלי תקשורת מכל הקשת.",
    interestsTitle: "מה מעניין אותך?",
    regionsTitle: "מאיפה החדשות?",
    notificationsTitle: "עדכונים",
    notificationsBody: "שלוש תזכורות ביום (בוקר, צהריים, ערב). אפשר לשנות בכל רגע בהעדפות.",
    next: "המשך",
    back: "חזרה",
    done: "בואו נתחיל",
    pickOne: "בחרו לפחות תחום אחד",
  },

  settings: {
    interests: "תחומי עניין",
    regions: "מקורות",
    translation: "שפת הכתבות",
    translationAuto: "תרגום אוטומטי לעברית",
    translationOriginal: "שפת המקור",
    translationSoon: "התרגום יתווסף בגרסה הבאה.",
    notifications: "התראות",
    notificationsSoon: "ההתראות יופעלו בגרסה הבאה. הבחירה שלך נשמרת.",
    about: "מידע",
    methodology: "איך אנחנו מדרגים",
    privacy: "מדיניות פרטיות",
    contact: "יצירת קשר ודיווח על טעות",
    version: (v: string) => `גרסה ${v}`,
  },

  regions: { il: "מהארץ", world: "מהעולם", both: "שניהם" },
  notifications: { morning: "בוקר (07:30)", noon: "צהריים (13:00)", evening: "ערב (20:00)" },
  allCategories: "הכל",
} as const;
