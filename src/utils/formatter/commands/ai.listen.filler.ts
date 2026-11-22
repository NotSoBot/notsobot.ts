// `.ai listen`: what was heard that isn't worth a (charged) NotSoAI turn. Kept conservative, anything that could be
// something said to it goes through: short real words ("skip", "stop", "no", "yes", "ok", "huh", a number), answers
// like "mhm"/"uh huh"/"ええ"/"嗯" (they can be replying to its question), and anything with a word that isn't a filler.
// No imports so it can be tested on its own

// hesitation sounds only, after `collapseRepeats` ("ummm" -> "um", "hmmm" -> "hm", "えーー" -> "えー"), by language.
// Affirmations aren't in here on purpose (mhm, uh huh, yeah, ええ, 嗯, 어), nor reactions that ask something (huh, hein)
const FILLER_WORDS: ReadonlySet<string> = new Set([
  // english
  'a', 'ah', 'eh', 'er', 'erm', 'hm', 'hum', 'm', 'oh', 'uh', 'uhm', 'um', 'umm',
  // spanish, portuguese, italian
  'ahn', 'eeh', 'ehm', 'em', 'hã', 'ãh', 'é', 'e',
  // french
  'euh', 'heu', 'bah',
  // german, dutch
  'äh', 'ähm', 'öh', 'öhm',
  // russian, polish, turkish
  'а', 'э', 'эм', 'эх', 'м', 'хм', 'ну', 'y', 'ı',
  // japanese, korean, chinese
  'あの', 'あのー', 'うーん', 'えっと', 'えーと', 'えー', 'えーっと', 'ん', 'んー', 'その', 'まあ',
  '음', '으음', '저기', '呃', '额', '唔',
]);

// what speech recognition (whisper) writes for noise or silence it couldn't make out, all of the utterance
const NOISE_TRANSCRIPTIONS: ReadonlySet<string> = new Set([
  'you',
  'thanks for watching',
  'thank you for watching',
  'thank you so much for watching',
  'please subscribe',
  'ご視聴ありがとうございました',
  'продолжение следует',
  'untertitel im auftrag des zdf',
]);

// subtitle credits whisper picked up from its training data ("Subtitles by the Amara.org community" in any language)
const NOISE_SUBSTRINGS: ReadonlyArray<string> = ['amara org'];

// "mm-hmm", "mmhm", "mm hm": a yes, even though "mm" and "hm" alone are fillers
const REGEX_AFFIRMATION = /^m+ ?h+m+$/u;

// a single letter of these is a word (停 "stop", 是 "yes"), one latin or cyrillic letter isn't
const REGEX_LOGOGRAPHIC = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

// whisper's notes for what wasn't speech ("[Music]", "(coughs)"), nobody says brackets out loud
const REGEX_NON_SPEECH = /\[[^\]]*\]|\([^)]*\)/gu;

// lowercase, non-speech notes, punctuation and symbols gone (the long vowel mark ー and apostrophes kept), one space
// between words
export function normalizeUtterance(text: string): string {
  return text
    .normalize('NFKC')
    .replace(REGEX_NON_SPEECH, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}ー'\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// a character said twice or more in a row is a drawn out sound, kept once ("ummm" -> "um", "えーーー" -> "えー")
function collapseRepeats(word: string): string {
  return word.replace(/(.)\1+/gu, '$1');
}

// true when the transcription is nothing to answer: empty, one letter, only hesitation sounds, or what whisper writes
// for noise
export function isFillerUtterance(text: string): boolean {
  const normalized = normalizeUtterance(text);
  if (!normalized) {
    return true;
  }
  if (NOISE_TRANSCRIPTIONS.has(normalized) || NOISE_SUBSTRINGS.some((x) => normalized.includes(x))) {
    return true;
  }
  if (REGEX_AFFIRMATION.test(normalized)) {
    return false;
  }
  const letters = normalized.replace(/[\s']/g, '');
  if (letters.length === 1 && !/\p{N}/u.test(letters) && !REGEX_LOGOGRAPHIC.test(letters)) {
    return true;
  }
  return normalized.split(' ').every((word) => FILLER_WORDS.has(word) || FILLER_WORDS.has(collapseRepeats(word)));
}
