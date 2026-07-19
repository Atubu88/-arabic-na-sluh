import type { Lesson } from "@/lib/types";

/**
 * Учебный контент намеренно хранится в коде, а не в D1.
 * Готовые MP3 лежат в public/audio. Границы реплик выставлены по паузам
 * в каждой записи и остаются легко редактируемыми рядом с текстом.
 */
export const lessons: Lesson[] = [
  {
    id: "introduction-001",
    level: 1,
    block: 1,
    blockTitle: "Знакомство",
    number: 1,
    title: "Первое знакомство",
    description: "Приветствие, представление и вопрос о делах",
    goal: "Научиться здороваться, представляться и спрашивать, как дела.",
    audioUrl: "/audio/block-01-lesson-01.mp3",
    audioStatus: "ready",
    durationMs: 18_364,
    lines: [
      { id: "introduction-001-line-01", speaker: "خَالِدٌ", arabic: "السَّلَامُ عَلَيْكُمْ.", translation: "Мир вам.", startMs: 0, endMs: 1_681 },
      { id: "introduction-001-line-02", speaker: "يُوسُفُ", arabic: "وَعَلَيْكُمُ السَّلَامُ.", translation: "И вам мир.", startMs: 1_681, endMs: 3_875 },
      { id: "introduction-001-line-03", speaker: "خَالِدٌ", arabic: "اِسْمِي خَالِدٌ، مَا اسْمُكَ؟", translation: "Меня зовут Халид. Как тебя зовут?", startMs: 3_875, endMs: 7_170 },
      { id: "introduction-001-line-04", speaker: "يُوسُفُ", arabic: "اِسْمِي يُوسُفُ.", translation: "Меня зовут Юсуф.", startMs: 7_170, endMs: 9_140 },
      { id: "introduction-001-line-05", speaker: "خَالِدٌ", arabic: "كَيْفَ حَالُكَ؟", translation: "Как твои дела?", startMs: 9_140, endMs: 11_012 },
      { id: "introduction-001-line-06", speaker: "يُوسُفُ", arabic: "بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ. وَأَنْتَ؟", translation: "Хорошо, хвала Аллаху. А ты?", startMs: 11_012, endMs: 15_489 },
      { id: "introduction-001-line-07", speaker: "خَالِدٌ", arabic: "بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ.", translation: "Хорошо, хвала Аллаху.", startMs: 15_489, endMs: 18_364 },
    ],
    shortAnalysis: [
      { arabic: "اِسْمٌ", explanation: "имя." },
      { arabic: "اِسْمِي", explanation: "моё имя. Окончание ـي означает «мой»." },
      { arabic: "اِسْمُكَ", explanation: "твоё имя при обращении к мужчине. Окончание ـكَ означает «твой»." },
      { arabic: "حَالُكَ", explanation: "твоё состояние, твои дела." },
      { arabic: "وَأَنْتَ؟", explanation: "а ты?" },
    ],
  },
  {
    id: "introduction-003",
    level: 1,
    block: 1,
    blockTitle: "Знакомство",
    number: 2,
    title: "Откуда ты?",
    description: "Страна, регион, город и национальность",
    goal: "Научиться спрашивать и говорить, откуда ты.",
    audioUrl: "/audio/block-01-lesson-02.mp3",
    audioStatus: "ready",
    durationMs: 18_678,
    lines: [
      { id: "introduction-003-line-01", speaker: "خَالِدٌ", arabic: "مِنْ أَيْنَ أَنْتَ؟", translation: "Откуда ты?", startMs: 0, endMs: 1_787 },
      { id: "introduction-003-line-02", speaker: "يُوسُفُ", arabic: "أَنَا مِنْ تَتَارِسْتَانَ، مِنْ قَازَانَ. وَأَنْتَ؟", translation: "Я из Татарстана, из Казани. А ты?", startMs: 1_787, endMs: 7_359 },
      { id: "introduction-003-line-03", speaker: "خَالِدٌ", arabic: "أَنَا مِنْ مِصْرَ، مِنَ الْقَاهِرَةِ.", translation: "Я из Египта, из Каира.", startMs: 7_359, endMs: 10_759 },
      { id: "introduction-003-line-04", speaker: "خَالِدٌ", arabic: "هَلْ أَنْتَ رُوسِيٌّ؟", translation: "Ты русский?", startMs: 10_759, endMs: 12_990 },
      { id: "introduction-003-line-05", speaker: "يُوسُفُ", arabic: "لَا، أَنَا مِصْرِيٌّ. وَأَنْتَ؟", translation: "Нет, я египтянин. А ты?", startMs: 12_990, endMs: 17_262 },
      { id: "introduction-003-line-06", speaker: "خَالِدٌ", arabic: "أَنَا رُوسِيٌّ.", translation: "Я русский.", startMs: 17_262, endMs: 18_678 },
    ],
    shortAnalysis: [
      { arabic: "مِنْ أَيْنَ؟", explanation: "откуда?" },
      { arabic: "أَنَا مِنْ…", explanation: "я из…" },
      { arabic: "هَلْ", explanation: "ставится в начале вопроса, на который отвечают «да» или «нет»." },
      { arabic: "رُوسِيٌّ", explanation: "русский." },
      { arabic: "مِصْرِيٌّ", explanation: "египтянин." },
    ],
  },
  {
    id: "introduction-004",
    level: 1,
    block: 1,
    blockTitle: "Знакомство",
    number: 3,
    title: "Где ты живёшь?",
    description: "Город и место проживания",
    goal: "Научиться спрашивать и говорить, где ты живёшь.",
    audioUrl: "/audio/block-01-lesson-03.mp3",
    audioStatus: "ready",
    durationMs: 20_114,
    lines: [
      { id: "introduction-004-line-01", speaker: "خَالِدٌ", arabic: "أَيْنَ تَسْكُنُ الآنَ؟", translation: "Где ты сейчас живёшь?", startMs: 0, endMs: 2_502 },
      { id: "introduction-004-line-02", speaker: "يُوسُفُ", arabic: "أَسْكُنُ فِي قَازَانَ.", translation: "Я живу в Казани.", startMs: 2_502, endMs: 5_564 },
      { id: "introduction-004-line-03", speaker: "خَالِدٌ", arabic: "هَلْ تَسْكُنُ فِي وَسَطِ الْمَدِينَةِ؟", translation: "Ты живёшь в центре города?", startMs: 5_564, endMs: 9_015 },
      { id: "introduction-004-line-04", speaker: "يُوسُفُ", arabic: "لَا، أَسْكُنُ قَرِيبًا مِنَ الْجَامِعَةِ.", translation: "Нет, я живу недалеко от университета.", startMs: 9_015, endMs: 13_840 },
      { id: "introduction-004-line-05", speaker: "خَالِدٌ", arabic: "هَلْ تُحِبُّ قَازَانَ؟", translation: "Тебе нравится Казань?", startMs: 13_840, endMs: 16_816 },
      { id: "introduction-004-line-06", speaker: "يُوسُفُ", arabic: "نَعَمْ، أُحِبُّهَا كَثِيرًا.", translation: "Да, она мне очень нравится.", startMs: 16_816, endMs: 20_114 },
    ],
    shortAnalysis: [
      { arabic: "تَسْكُنُ", explanation: "ты живёшь." },
      { arabic: "أَسْكُنُ", explanation: "я живу. Начальная تـ здесь указывает на «ты», а أَ — на «я»." },
      { arabic: "قَرِيبًا مِنْ", explanation: "рядом с, недалеко от." },
      { arabic: "تُحِبُّ", explanation: "ты любишь, тебе нравится." },
      { arabic: "أُحِبُّهَا", explanation: "я люблю её, она мне нравится. Окончание ـهَا означает «её»." },
    ],
  },
  {
    id: "introduction-005",
    level: 1,
    block: 1,
    blockTitle: "Знакомство",
    number: 4,
    title: "Новый знакомый",
    description: "Представление друга и знакомство",
    goal: "Научиться представлять друга и знакомиться с новым человеком.",
    audioUrl: "/audio/block-01-lesson-04.mp3",
    audioStatus: "ready",
    durationMs: 19_801,
    lines: [
      { id: "introduction-005-line-01", speaker: "خَالِدٌ", arabic: "يَا يُوسُفُ، هَذَا صَدِيقِي أَحْمَدُ.", translation: "Юсуф, это мой друг Ахмад.", startMs: 0, endMs: 2_617 },
      { id: "introduction-005-line-02", speaker: "يُوسُفُ", arabic: "أَهْلًا يَا أَحْمَدُ، أَنَا يُوسُفُ.", translation: "Привет, Ахмад. Я Юсуф.", startMs: 2_617, endMs: 5_358 },
      { id: "introduction-005-line-03", speaker: "أَحْمَدُ", arabic: "أَهْلًا يَا يُوسُفُ.", translation: "Привет, Юсуф.", startMs: 5_358, endMs: 6_922 },
      { id: "introduction-005-line-04", speaker: "يُوسُفُ", arabic: "مِنْ أَيْنَ أَنْتَ؟", translation: "Откуда ты?", startMs: 6_922, endMs: 8_703 },
      { id: "introduction-005-line-05", speaker: "أَحْمَدُ", arabic: "أَنَا مِنْ تُرْكِيَا، وَأَسْكُنُ الآنَ فِي قَازَانَ.", translation: "Я из Турции, а сейчас живу в Казани.", startMs: 8_703, endMs: 14_502 },
      { id: "introduction-005-line-06", speaker: "يُوسُفُ", arabic: "هَلْ تَدْرُسُ هُنَا؟", translation: "Ты здесь учишься?", startMs: 14_502, endMs: 16_313 },
      { id: "introduction-005-line-07", speaker: "أَحْمَدُ", arabic: "نَعَمْ، أَدْرُسُ مَعَ خَالِدٍ فِي الْجَامِعَةِ.", translation: "Да, я учусь с Халидом в университете.", startMs: 16_313, endMs: 19_801 },
    ],
    shortAnalysis: [
      { arabic: "هَذَا", explanation: "это, при указании на мужчину." },
      { arabic: "صَدِيقٌ", explanation: "друг." },
      { arabic: "صَدِيقِي", explanation: "мой друг. Окончание ـي означает «мой»." },
      { arabic: "تَدْرُسُ", explanation: "ты учишься." },
      { arabic: "أَدْرُسُ", explanation: "я учусь." },
      { arabic: "هُنَا", explanation: "здесь." },
      { arabic: "مَعَ", explanation: "с, вместе с." },
    ],
  },
];

export function getLesson(lessonId: string) {
  return lessons.find((lesson) => lesson.id === lessonId) ?? null;
}
