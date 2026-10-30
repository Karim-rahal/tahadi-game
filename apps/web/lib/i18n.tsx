"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Lightweight UI i18n. Only the interface chrome (buttons, labels, headings) is
 * translated — question CONTENT stays Arabic (it's an Arabic quiz). Default is
 * English. The choice is per-device (localStorage) and drives document dir.
 */
export type Lang = "en" | "ar";
const KEY = "darundi.lang.v1";

type Entry = { en: string; ar: string };
type Dict = Record<string, Entry>;

const DICT: Dict = {
  // Brand / generic
  "brand.tagline": { en: "Two-team quiz", ar: "مسابقة الفريقين" },
  "common.cancel": { en: "Cancel", ar: "إلغاء" },
  "common.home": { en: "Home", ar: "الرئيسية" },
  "common.back": { en: "Back", ar: "رجوع" },
  "common.loading": { en: "Loading…", ar: "جارِ التحميل…" },
  "common.retry": { en: "Try again", ar: "إعادة المحاولة" },
  "common.team1": { en: "Team 1", ar: "الفريق الأول" },
  "common.team2": { en: "Team 2", ar: "الفريق الثاني" },

  // Question types
  "type.FASTEST": { en: "Fastest Buzz", ar: "الأسرع يجاوب" },
  "type.WHO_AM_I": { en: "Who Am I?", ar: "من أنا؟" },
  "type.TRUE_FALSE": { en: "True or False", ar: "صح أم خطأ" },
  "type.ENUMERATE": { en: "List the Answers", ar: "عدّد الإجابات" },
  "diff.EASY": { en: "Easy", ar: "سهل" },
  "diff.MEDIUM": { en: "Medium", ar: "متوسط" },
  "diff.HARD": { en: "Hard", ar: "صعب" },
  "status.SETUP": { en: "Setup", ar: "قيد الإعداد" },
  "status.ACTIVE": { en: "Live", ar: "جارية" },
  "status.PAUSED": { en: "Paused", ar: "متوقفة مؤقتاً" },
  "status.FINISHED": { en: "Finished", ar: "منتهية" },
  "sb.turn": { en: "Its turn", ar: "دوره الآن" },
  "disclaimer.text": {
    en: "Some questions or answers may contain inaccuracies. Your feedback helps us improve the game.",
    ar: "قد تحتوي بعض الأسئلة أو الإجابات على معلومات غير دقيقة. نرحّب بملاحظاتكم لتحسين اللعبة.",
  },

  // Home
  "home.intro": {
    en: "Two teams go head to head while the referee reads the questions and keeps score. Every question is worth one point — the app runs the turns, strikes, passes and advances automatically.",
    ar: "فريقان يتبارزان، والحكَم يقرأ الأسئلة ويحتسب النقاط. كل سؤال بنقطة واحدة — والتطبيق يدير الأدوار والأخطاء والتمريرات والانتقال تلقائياً.",
  },
  "home.newMatch": { en: "Start a new match", ar: "ابدأ مباراة جديدة" },
  "home.resume": { en: "Resume a match", ar: "متابعة مباراة" },
  "home.bank": { en: "Question bank", ar: "بنك الأسئلة" },
  "home.bankReligious": { en: "Religious questions", ar: "أسئلة دينية" },
  "home.bankGeography": { en: "World & Geography", ar: "بلاد العالم والجغرافيا" },
  "home.count600": { en: "600 questions", ar: "٦٠٠ سؤال" },

  // Setup
  "setup.title": { en: "Match setup", ar: "إعداد المباراة" },
  "setup.subtitle": { en: "Pick the teams and questions, or start right away with the recommended settings.", ar: "اختر الفريقين والأسئلة، أو ابدأ فوراً بالإعدادات الموصى بها." },
  "setup.quickStart": { en: "Quick start", ar: "بداية سريعة" },
  "setup.orCustomize": { en: "or customize", ar: "أو خصّص الإعدادات" },
  "setup.team1Name": { en: "Team 1 name", ar: "اسم الفريق الأول" },
  "setup.team2Name": { en: "Team 2 name", ar: "اسم الفريق الثاني" },
  "setup.whoStarts": { en: "Who starts?", ar: "من يبدأ أولاً؟" },
  "setup.categories": { en: "Categories", ar: "التصنيفات" },
  "setup.types": { en: "Question types", ar: "أنواع الأسئلة" },
  "setup.typesNote": { en: "All difficulty levels are included automatically and questions are randomized.", ar: "تُختار كل مستويات الصعوبة تلقائياً وتُوزّع الأسئلة عشوائياً." },
  "setup.numQuestions": { en: "Number of questions", ar: "عدد الأسئلة" },
  "setup.available": { en: "Available", ar: "المتاح" },
  "setup.ready": { en: "Ready to start", ar: "جاهز للبدء" },
  "setup.excludeFlagged": { en: "Exclude questions flagged for review", ar: "استبعاد الأسئلة الموسومة للمراجعة" },
  "setup.start": { en: "Start match", ar: "ابدأ المباراة" },
  "setup.loadingCats": { en: "Loading…", ar: "جارِ التحميل…" },
  "setup.noCats": { en: "No categories — run the import first.", ar: "لا توجد تصنيفات — شغّل أمر الاستيراد أولاً." },
  "setup.errCats": { en: "Couldn't load categories. Make sure the server is running and questions are imported.", ar: "تعذّر تحميل التصنيفات. تأكد من تشغيل الخادم واستيراد الأسئلة." },
  "setup.errEnterCount": { en: "Enter the number of questions.", ar: "أدخل عدد الأسئلة." },
  "setup.errMin": { en: "The minimum is one question.", ar: "أقل عدد هو سؤال واحد." },
  "setup.errMax": { en: "The maximum available is {n}.", ar: "الحد الأقصى المتاح {n}." },
  "setup.errNone": { en: "No questions available with these options.", ar: "لا أسئلة متاحة بهذه الخيارات." },
  "setup.errPickCat": { en: "Pick at least one category.", ar: "اختر تصنيفاً واحداً على الأقل." },
  "setup.errPickType": { en: "Pick at least one question type.", ar: "اختر نوع سؤال واحداً على الأقل." },
  "setup.errCreate": { en: "Couldn't create the match.", ar: "تعذّر إنشاء المباراة." },

  // Game chrome
  "game.loadFatalAccess": { en: "You don't have access to this match on this device.", ar: "لا تملك صلاحية الوصول إلى هذه المباراة على هذا الجهاز." },
  "game.loadFatal": { en: "Couldn't load the match. Check your connection and try again.", ar: "تعذّر تحميل المباراة. تحقّق من الاتصال وحاول مجدداً." },
  "game.savedMatches": { en: "Saved matches", ar: "المباريات المحفوظة" },
  "game.readyStart": { en: "Everything is ready — start the match whenever you like.", ar: "كل شيء جاهز — ابدأ المباراة متى شئت." },
  "game.start": { en: "Start the match", ar: "ابدأ المباراة" },
  "game.paused": { en: "The match is paused", ar: "المباراة متوقفة مؤقتاً" },
  "game.resume": { en: "Resume", ar: "استئناف" },
  "game.noMore": { en: "No questions left", ar: "انتهت أسئلة المباراة" },
  "game.showFinal": { en: "Show final result", ar: "عرض النتيجة النهائية" },
  "game.undo": { en: "Undo", ar: "تراجع" },
  "game.skip": { en: "Skip", ar: "تخطّي" },
  "game.error": { en: "Something went wrong, try again.", ar: "حدث خطأ، حاول مرة أخرى." },
  "game.tiebreakBanner": { en: "Sudden death — it's a tie! The winner of this question takes the match.", ar: "جولة الحسم — تعادل! الفائز بهذا السؤال يكسب المباراة" },

  // Report
  "report.aria": { en: "Report question", ar: "إبلاغ عن السؤال" },
  "report.title": { en: "Report this question", ar: "الإبلاغ عن السؤال" },
  "report.desc": { en: "Describe the problem (inaccurate answer, unclear wording…). It's saved for review.", ar: "صف المشكلة (إجابة غير دقيقة، صياغة ملتبسة…). يُحفظ البلاغ للمراجعة لاحقاً." },
  "report.send": { en: "Send report", ar: "إرسال البلاغ" },
  "report.err": { en: "Couldn't send the report.", ar: "تعذّر إرسال البلاغ." },

  // Question meta / parts
  "q.onePoint": { en: "1 point", ar: "نقطة واحدة" },
  "q.reviewTitle": { en: "Review notice", ar: "تنبيه مراجعة" },
  "q.reviewDraft": { en: "A draft question whose sources weren't individually checked — you can skip or report it.", ar: "سؤال من مسودة لم تُدقّق مصادرها فردياً — يمكنك تخطّيه أو الإبلاغ عنه." },
  "q.reviewIncomplete": { en: "The answer list may be incomplete; don't treat it as final.", ar: "قائمة الإجابات قد تكون غير مكتملة؛ لا تعدّها نهائية." },
  "q.revealAnswer": { en: "Reveal answer (referee)", ar: "كشف الإجابة (للحكَم)" },
  "q.hideAnswer": { en: "Hide answer", ar: "إخفاء الإجابة" },
  "q.modelAnswer": { en: "Model answer", ar: "الإجابة النموذجية" },
  "q.answeredCorrectly": { en: "answered correctly", ar: "أجاب صحيحاً" },

  // Fastest
  "fast.readAloud": { en: "The referee reads the question; the first team to answer correctly takes the point:", ar: "يقرأ الحكَم السؤال، وأول فريق يجيب صحيحاً يأخذ النقطة:" },
  "fast.whoFirst": { en: "Who answered first and correctly?", ar: "من أجاب أولاً وبشكل صحيح؟" },
  "fast.noneHint": { en: "Nobody answered correctly? Use Skip.", ar: "لم يُجب أحد إجابة صحيحة؟ استخدم «تخطّي»." },

  // Who am I
  "who.hintOf": { en: "Hint {a} of {b}", ar: "تلميح {a} من {b}" },
  "who.noPenalty": { en: "Hints don't reduce points", ar: "التلميحات لا تُنقص النقاط" },
  "who.revealNext": { en: "Reveal next hint", ar: "كشف التلميح التالي" },
  "who.allRevealed": { en: "All hints revealed", ar: "تم كشف كل التلميحات" },
  "who.whoGuessed": { en: "Who guessed it correctly?", ar: "من خمّن الإجابة الصحيحة؟" },
  "who.note": { en: "Wrong guesses aren't recorded — the team that answers correctly takes the point.", ar: "لا تُسجّل التخمينات الخاطئة — عند الإجابة الصحيحة يأخذ الفريق النقطة." },

  // True / false
  "tf.belongsTo": { en: "This question goes to", ar: "هذا السؤال من نصيب" },
  "tf.noInterrupt": { en: "The other team can't interrupt", ar: "الفريق الآخر لا يستطيع المقاطعة" },
  "tf.record": { en: "Record the team's spoken answer:", ar: "سجّل إجابة الفريق الشفهية:" },
  "tf.true": { en: "True", ar: "صح" },
  "tf.false": { en: "False", ar: "خطأ" },
  "tf.note": { en: "Correct = a point · Wrong = no point — then it advances automatically.", ar: "إجابة صحيحة = نقطة · إجابة خاطئة = لا نقطة — ثم ينتقل تلقائياً." },

  // Enumerate
  "en.remaining": { en: "Remaining in the list", ar: "المتبقّي في القائمة" },
  "en.minimum": { en: "Minimum", ar: "الحد الأدنى" },
  "en.strikes": { en: "Strikes", ar: "الأخطاء" },
  "en.pass": { en: "Pass", ar: "التمرير" },
  "en.passUsed": { en: "used", ar: "استُخدم" },
  "en.passAvail": { en: "available", ar: "متاح" },
  "en.turnNow": { en: "Answering now:", ar: "دور الإجابة الآن:" },
  "en.checklist": { en: "Accepted answers (referee)", ar: "قائمة الإجابات المقبولة (للحكَم)" },
  "en.search": { en: "Search answers / aliases…", ar: "ابحث في الإجابات أو المرادفات…" },
  "en.noMatch": { en: "No matching answer.", ar: "لا إجابة مطابقة." },
  "en.show": { en: "Show", ar: "إظهار" },
  "en.hide": { en: "Hide", ar: "إخفاء" },
  "en.hidden": { en: "List hidden.", ar: "القائمة مخفية." },
  "en.manualPlaceholder": { en: "Manually accept an answer not in the list…", ar: "قبول يدوي لإجابة خارج القائمة…" },
  "en.accept": { en: "Accept", ar: "قبول" },
  "en.strikeBtn": { en: "Wrong (strike)", ar: "خطأ (ضربة)" },
  "en.passBtn": { en: "Pass", ar: "تمرير" },
  "en.note": { en: "The round ends automatically at 3 strikes or when all answers are used — then it advances.", ar: "تنتهي الجولة تلقائياً عند بلوغ ٣ أخطاء أو انتهاء كل الإجابات — ثم ينتقل للسؤال التالي." },

  // Result transition
  "res.pointTo": { en: "Point to {team}", ar: "نقطة إلى {team}" },
  "res.noPoint": { en: "No point", ar: "بلا نقطة" },
  "res.tieNoPoint": { en: "Tie — no point", ar: "تعادل — لا نقطة" },
  "res.skipped": { en: "Question skipped", ar: "تم تخطّي السؤال" },
  "res.replacement": { en: "a replacement is coming", ar: "سؤال بديل قادم" },
  "res.correct": { en: "Correct answer", ar: "إجابة صحيحة" },
  "res.wrong": { en: "Wrong answer", ar: "إجابة غير صحيحة" },
  "res.toNext": { en: "Moving to the next question", ar: "الانتقال إلى السؤال التالي" },
  "res.toFinal": { en: "Showing final result", ar: "عرض النتيجة النهائية" },
  "res.tieNext": { en: "Tie — sudden death next", ar: "تعادل — جولة حسم قادمة" },
  "res.reason.threeStrikes": { en: "the other team reached three strikes", ar: "بلغ الفريق الآخر ثلاثة أخطاء" },
  "res.reason.fewerStrikes": { en: "fewer strikes", ar: "أخطاء أقل" },
  "res.reason.unusedPass": { en: "didn't use its pass", ar: "لم يستخدم التمرير" },
  "res.reason.tie": { en: "tie in strikes and passes", ar: "تعادل في الأخطاء والتمرير" },

  // Winner
  "win.winner": { en: "Winner", ar: "الفريق الفائز" },
  "win.tie": { en: "It's a tie!", ar: "تعادل!" },
  "win.newMatch": { en: "New match", ar: "مباراة جديدة" },

  // Saved matches
  "saved.title": { en: "Saved matches", ar: "المباريات المحفوظة" },
  "saved.subtitle": { en: "Matches you started on this device. Resume any of them where you left off.", ar: "المباريات التي بدأتها على هذا الجهاز. تابع أياً منها من حيث توقفت." },
  "saved.empty": { en: "No saved matches on this device yet.", ar: "لا توجد مباريات محفوظة على هذا الجهاز بعد." },
  "saved.vs": { en: "vs", ar: "ضد" },
  "saved.resumeBtn": { en: "Resume", ar: "متابعة" },
  "saved.note": { en: "Deleting here only removes the shortcut from this device; it doesn't delete the match from the database.", ar: "الحذف هنا يزيل الاختصار من هذا الجهاز فقط، ولا يحذف المباراة من قاعدة البيانات." },

  // Timer
  "timer.title": { en: "Referee timer", ar: "مؤقّت الحكَم" },
  "timer.start": { en: "Start", ar: "ابدأ" },
  "timer.pause": { en: "Pause", ar: "إيقاف" },
  "timer.restart": { en: "Restart", ar: "إعادة" },
  "timer.reset": { en: "Reset", ar: "تصفير" },
  "timer.timeUp": { en: "Time's up", ar: "انتهى الوقت" },

  // Question bank
  "bank.title": { en: "Question bank", ar: "بنك الأسئلة" },
  "bank.subtitle": { en: "Browse imported questions and review their status and sources.", ar: "تصفّح الأسئلة المستوردة وراجِع حالتها ومصادرها." },
  "bank.results": { en: "{n} results", ar: "{n} نتيجة" },
  "bank.search": { en: "Search question text…", ar: "ابحث في نص السؤال…" },
  "bank.allCats": { en: "All categories", ar: "كل التصنيفات" },
  "bank.allTypes": { en: "All types", ar: "كل الأنواع" },
  "bank.allDiffs": { en: "All levels", ar: "كل المستويات" },
  "bank.flaggedOnly": { en: "Flagged for review only", ar: "الموسومة للمراجعة فقط" },
  "bank.review": { en: "review", ar: "مراجعة" },
  "bank.disabled": { en: "disabled", ar: "معطّل" },
  "bank.reports": { en: "reports: {n}", ar: "بلاغات: {n}" },
  "bank.answer": { en: "Answer:", ar: "الإجابة:" },
  "bank.hints": { en: "Hints:", ar: "التلميحات:" },
  "bank.accepted": { en: "Accepted answers ({n}):", ar: "إجابات مقبولة ({n}):" },
  "bank.explanation": { en: "Explanation:", ar: "تفسير:" },
  "bank.incomplete": { en: "⚠ The answer list may be incomplete.", ar: "⚠ قائمة الإجابات قد تكون غير مكتملة." },
  "bank.statusLbl": { en: "Status:", ar: "الحالة:" },
  "bank.source": { en: "Source:", ar: "المصدر:" },
  "bank.prev": { en: "Previous", ar: "السابق" },
  "bank.next": { en: "Next", ar: "التالي" },
  "bank.noResults": { en: "No matching results.", ar: "لا نتائج مطابقة." },
  "bank.loading": { en: "Loading…", ar: "جارِ التحميل…" },
};

interface Ctx {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LangCtx = createContext<Ctx>({
  lang: "en",
  dir: "ltr",
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s === "ar" || s === "en") setLangState(s);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const e = DICT[key];
      let s = e ? e[lang] : key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [lang],
  );

  return (
    <LangCtx.Provider value={{ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang: setLangState, t }}>
      {children}
    </LangCtx.Provider>
  );
}

export const useLang = () => useContext(LangCtx);
