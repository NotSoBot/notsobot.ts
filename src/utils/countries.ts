// the flags `/game flag` can show, with what counts as naming them. Country names come from `Intl.DisplayNames`, so
// every language the bot speaks gets them for free, `aliases` are the english names people actually type


export enum CountryTiers {
  // flags most people know
  EASY = 1,
  // every other country (and the uk's home nations)
  MEDIUM = 2,
  // territories with their own flag, the ones that just fly their country's flag are left out
  HARD = 3,
}

export interface Country {
  aliases?: Array<string>,
  // flagcdn's code: an iso 3166-1 alpha-2 code, or a subdivision like `gb-sct`
  code: string,
  // the english name when `Intl.DisplayNames`' is awkward ("Congo - Kinshasa") or missing (subdivisions have none),
  // other languages keep theirs
  name?: string,
  tier: CountryTiers,
}

const { EASY, MEDIUM, HARD } = CountryTiers;

export const Countries: ReadonlyArray<Country> = Object.freeze([
  {code: 'ae', tier: EASY, aliases: ['uae', 'emirates']},
  {code: 'ar', tier: EASY},
  {code: 'at', tier: EASY},
  {code: 'au', tier: EASY},
  {code: 'bd', tier: EASY},
  {code: 'be', tier: EASY},
  {code: 'br', tier: EASY},
  {code: 'ca', tier: EASY},
  {code: 'ch', tier: EASY},
  {code: 'cl', tier: EASY},
  {code: 'cn', tier: EASY, aliases: ['prc', 'peoples republic of china']},
  {code: 'co', tier: EASY},
  {code: 'cu', tier: EASY},
  {code: 'cz', tier: EASY, aliases: ['czech republic', 'czech']},
  {code: 'de', tier: EASY},
  {code: 'dk', tier: EASY},
  {code: 'dz', tier: EASY},
  {code: 'eg', tier: EASY},
  {code: 'es', tier: EASY},
  {code: 'fi', tier: EASY},
  {code: 'fr', tier: EASY},
  {code: 'gb', tier: EASY, aliases: ['uk', 'britain', 'great britain', 'united kingdom of great britain and northern ireland']},
  {code: 'gr', tier: EASY},
  {code: 'hr', tier: EASY},
  {code: 'hu', tier: EASY},
  {code: 'id', tier: EASY},
  {code: 'ie', tier: EASY, aliases: ['republic of ireland', 'eire']},
  {code: 'il', tier: EASY},
  {code: 'in', tier: EASY},
  {code: 'iq', tier: EASY},
  {code: 'ir', tier: EASY, aliases: ['persia']},
  {code: 'is', tier: EASY},
  {code: 'it', tier: EASY},
  {code: 'jm', tier: EASY},
  {code: 'jp', tier: EASY},
  {code: 'ke', tier: EASY},
  {code: 'kp', tier: EASY, aliases: ['dprk']},
  {code: 'kr', tier: EASY, aliases: ['korea', 'republic of korea']},
  {code: 'ma', tier: EASY},
  {code: 'mx', tier: EASY},
  {code: 'my', tier: EASY},
  {code: 'ng', tier: EASY},
  {code: 'nl', tier: EASY, aliases: ['holland', 'the netherlands']},
  {code: 'no', tier: EASY},
  {code: 'nz', tier: EASY},
  {code: 'pe', tier: EASY},
  {code: 'ph', tier: EASY},
  {code: 'pk', tier: EASY},
  {code: 'pl', tier: EASY},
  {code: 'pt', tier: EASY},
  {code: 'ro', tier: EASY},
  {code: 'rs', tier: EASY},
  {code: 'ru', tier: EASY, aliases: ['russian federation']},
  {code: 'sa', tier: EASY, aliases: ['ksa']},
  {code: 'se', tier: EASY},
  {code: 'sg', tier: EASY},
  {code: 'th', tier: EASY},
  {code: 'tr', tier: EASY, aliases: ['turkey']},
  {code: 'ua', tier: EASY},
  {code: 'us', tier: EASY, aliases: ['usa', 'us', 'america', 'united states of america']},
  {code: 've', tier: EASY},
  {code: 'vn', tier: EASY, aliases: ['viet nam']},
  {code: 'za', tier: EASY, aliases: ['rsa']},

  {code: 'ad', tier: MEDIUM},
  {code: 'af', tier: MEDIUM},
  {code: 'ag', tier: MEDIUM, aliases: ['antigua']},
  {code: 'al', tier: MEDIUM},
  {code: 'am', tier: MEDIUM},
  {code: 'ao', tier: MEDIUM},
  {code: 'az', tier: MEDIUM},
  {code: 'ba', tier: MEDIUM, aliases: ['bosnia']},
  {code: 'bb', tier: MEDIUM},
  {code: 'bf', tier: MEDIUM},
  {code: 'bg', tier: MEDIUM},
  {code: 'bh', tier: MEDIUM},
  {code: 'bi', tier: MEDIUM},
  {code: 'bj', tier: MEDIUM},
  {code: 'bn', tier: MEDIUM, aliases: ['brunei darussalam']},
  {code: 'bo', tier: MEDIUM},
  {code: 'bs', tier: MEDIUM},
  {code: 'bt', tier: MEDIUM},
  {code: 'bw', tier: MEDIUM},
  {code: 'by', tier: MEDIUM},
  {code: 'bz', tier: MEDIUM},
  {code: 'cd', tier: MEDIUM, name: 'DR Congo', aliases: ['drc', 'congo', 'democratic republic of the congo', 'congo kinshasa', 'zaire']},
  {code: 'cf', tier: MEDIUM, aliases: ['car']},
  {code: 'cg', tier: MEDIUM, name: 'Republic of the Congo', aliases: ['congo', 'congo brazzaville']},
  {code: 'ci', tier: MEDIUM, aliases: ['ivory coast']},
  {code: 'cm', tier: MEDIUM},
  {code: 'cr', tier: MEDIUM},
  {code: 'cv', tier: MEDIUM, aliases: ['cabo verde']},
  {code: 'cy', tier: MEDIUM},
  {code: 'dj', tier: MEDIUM},
  {code: 'dm', tier: MEDIUM},
  {code: 'do', tier: MEDIUM, aliases: ['dr']},
  {code: 'ec', tier: MEDIUM},
  {code: 'ee', tier: MEDIUM},
  {code: 'er', tier: MEDIUM},
  {code: 'et', tier: MEDIUM},
  {code: 'fj', tier: MEDIUM},
  {code: 'fm', tier: MEDIUM, aliases: ['federated states of micronesia']},
  {code: 'ga', tier: MEDIUM},
  {code: 'gb-eng', tier: MEDIUM, name: 'England'},
  {code: 'gb-sct', tier: MEDIUM, name: 'Scotland'},
  {code: 'gb-wls', tier: MEDIUM, name: 'Wales'},
  {code: 'gd', tier: MEDIUM},
  {code: 'ge', tier: MEDIUM},
  {code: 'gh', tier: MEDIUM},
  {code: 'gm', tier: MEDIUM, aliases: ['the gambia']},
  {code: 'gn', tier: MEDIUM},
  {code: 'gq', tier: MEDIUM},
  {code: 'gt', tier: MEDIUM},
  {code: 'gw', tier: MEDIUM},
  {code: 'gy', tier: MEDIUM},
  {code: 'hn', tier: MEDIUM},
  {code: 'ht', tier: MEDIUM},
  {code: 'jo', tier: MEDIUM},
  {code: 'kg', tier: MEDIUM},
  {code: 'kh', tier: MEDIUM},
  {code: 'ki', tier: MEDIUM},
  {code: 'km', tier: MEDIUM},
  {code: 'kn', tier: MEDIUM, aliases: ['saint kitts', 'st kitts']},
  {code: 'kw', tier: MEDIUM},
  {code: 'kz', tier: MEDIUM},
  {code: 'la', tier: MEDIUM, aliases: ['lao']},
  {code: 'lb', tier: MEDIUM},
  {code: 'lc', tier: MEDIUM},
  {code: 'li', tier: MEDIUM},
  {code: 'lk', tier: MEDIUM, aliases: ['ceylon']},
  {code: 'lr', tier: MEDIUM},
  {code: 'ls', tier: MEDIUM},
  {code: 'lt', tier: MEDIUM},
  {code: 'lu', tier: MEDIUM},
  {code: 'lv', tier: MEDIUM},
  {code: 'ly', tier: MEDIUM},
  {code: 'mc', tier: MEDIUM},
  {code: 'md', tier: MEDIUM},
  {code: 'me', tier: MEDIUM},
  {code: 'mg', tier: MEDIUM},
  {code: 'mh', tier: MEDIUM},
  {code: 'mk', tier: MEDIUM, aliases: ['macedonia']},
  {code: 'ml', tier: MEDIUM},
  {code: 'mm', tier: MEDIUM},
  {code: 'mn', tier: MEDIUM},
  {code: 'mr', tier: MEDIUM},
  {code: 'mt', tier: MEDIUM},
  {code: 'mu', tier: MEDIUM},
  {code: 'mv', tier: MEDIUM},
  {code: 'mw', tier: MEDIUM},
  {code: 'mz', tier: MEDIUM},
  {code: 'na', tier: MEDIUM},
  {code: 'ne', tier: MEDIUM},
  {code: 'ni', tier: MEDIUM},
  {code: 'np', tier: MEDIUM},
  {code: 'nr', tier: MEDIUM},
  {code: 'om', tier: MEDIUM},
  {code: 'pa', tier: MEDIUM},
  {code: 'pg', tier: MEDIUM, aliases: ['png']},
  {code: 'ps', tier: MEDIUM, name: 'Palestine'},
  {code: 'pw', tier: MEDIUM},
  {code: 'py', tier: MEDIUM},
  {code: 'qa', tier: MEDIUM},
  {code: 'rw', tier: MEDIUM},
  {code: 'sb', tier: MEDIUM},
  {code: 'sc', tier: MEDIUM},
  {code: 'sd', tier: MEDIUM},
  {code: 'si', tier: MEDIUM},
  {code: 'sk', tier: MEDIUM},
  {code: 'sl', tier: MEDIUM},
  {code: 'sm', tier: MEDIUM},
  {code: 'sn', tier: MEDIUM},
  {code: 'so', tier: MEDIUM},
  {code: 'sr', tier: MEDIUM},
  {code: 'ss', tier: MEDIUM},
  {code: 'st', tier: MEDIUM, aliases: ['sao tome']},
  {code: 'sv', tier: MEDIUM},
  {code: 'sy', tier: MEDIUM},
  {code: 'sz', tier: MEDIUM, aliases: ['swaziland']},
  {code: 'td', tier: MEDIUM},
  {code: 'tg', tier: MEDIUM},
  {code: 'tj', tier: MEDIUM},
  {code: 'tl', tier: MEDIUM, aliases: ['east timor']},
  {code: 'tm', tier: MEDIUM},
  {code: 'tn', tier: MEDIUM},
  {code: 'to', tier: MEDIUM},
  {code: 'tt', tier: MEDIUM, aliases: ['trinidad']},
  {code: 'tv', tier: MEDIUM},
  {code: 'tw', tier: MEDIUM, aliases: ['republic of china', 'roc']},
  {code: 'tz', tier: MEDIUM},
  {code: 'ug', tier: MEDIUM},
  {code: 'uy', tier: MEDIUM},
  {code: 'uz', tier: MEDIUM},
  {code: 'va', tier: MEDIUM, aliases: ['vatican', 'holy see']},
  {code: 'vc', tier: MEDIUM, aliases: ['saint vincent', 'st vincent', 'saint vincent and the grenadines']},
  {code: 'vu', tier: MEDIUM},
  {code: 'ws', tier: MEDIUM},
  {code: 'xk', tier: MEDIUM},
  {code: 'ye', tier: MEDIUM},
  {code: 'zm', tier: MEDIUM},
  {code: 'zw', tier: MEDIUM},

  {code: 'ai', tier: HARD},
  {code: 'as', tier: HARD},
  {code: 'aw', tier: HARD},
  {code: 'ax', tier: HARD, aliases: ['aland']},
  {code: 'bm', tier: HARD},
  {code: 'cc', tier: HARD, aliases: ['cocos islands', 'keeling islands']},
  {code: 'ck', tier: HARD},
  {code: 'cw', tier: HARD},
  {code: 'cx', tier: HARD},
  {code: 'eh', tier: HARD},
  {code: 'fk', tier: HARD, aliases: ['falklands', 'malvinas']},
  {code: 'fo', tier: HARD, aliases: ['faroes', 'faroe']},
  {code: 'gg', tier: HARD},
  {code: 'gi', tier: HARD},
  {code: 'gl', tier: HARD},
  {code: 'gs', tier: HARD, aliases: ['south georgia']},
  {code: 'gu', tier: HARD},
  {code: 'hk', tier: HARD, name: 'Hong Kong'},
  {code: 'im', tier: HARD},
  {code: 'io', tier: HARD, aliases: ['chagos islands', 'biot']},
  {code: 'je', tier: HARD},
  {code: 'ky', tier: HARD, aliases: ['caymans']},
  {code: 'mo', tier: HARD, name: 'Macau', aliases: ['macao']},
  {code: 'mp', tier: HARD},
  {code: 'ms', tier: HARD},
  {code: 'nc', tier: HARD},
  {code: 'nf', tier: HARD},
  {code: 'nu', tier: HARD},
  {code: 'pf', tier: HARD, aliases: ['tahiti']},
  {code: 'pn', tier: HARD, aliases: ['pitcairn']},
  {code: 'pr', tier: HARD},
  {code: 'sh', tier: HARD},
  {code: 'sx', tier: HARD},
  {code: 'tc', tier: HARD, aliases: ['turks and caicos']},
  {code: 'tf', tier: HARD},
  {code: 'tk', tier: HARD},
  {code: 'vg', tier: HARD, aliases: ['bvi', 'virgin islands']},
  {code: 'vi', tier: HARD, aliases: ['usvi', 'virgin islands']},
] as Array<Country>);


// the first hint `/game flag` gives, roughly the un's regions (the caribbean and central america are north america,
// the middle east, turkey and the caucasus are asia, remote territories go with the nearest continent)
export enum CountryRegions {
  AFRICA = 'africa',
  ASIA = 'asia',
  EUROPE = 'europe',
  NORTH_AMERICA = 'north_america',
  OCEANIA = 'oceania',
  SOUTH_AMERICA = 'south_america',
}

const REGION_CODES: Record<CountryRegions, string> = {
  [CountryRegions.AFRICA]: 'ao bf bi bj bw cd cf cg ci cm cv dj dz eg eh er et ga gh gm gn gq gw ke km lr ls ly ma mg ml mr mu mw mz na ne ng rw sc sd sh sl sn so ss st sz td tf tg tn tz ug za zm zw',
  [CountryRegions.ASIA]: 'ae af am az bd bh bn bt cc cn cx cy ge hk id il in io iq ir jo jp kg kh kp kr kw kz la lb lk mm mn mo mv my np om ph pk ps qa sa sg sy th tj tl tm tr tw uz vn ye',
  [CountryRegions.EUROPE]: 'ad al at ax ba be bg by ch cz de dk ee es fi fo fr gb gb-eng gb-sct gb-wls gg gi gr hr hu ie im is it je li lt lu lv mc md me mk mt nl no pl pt ro rs ru se si sk sm ua va xk',
  [CountryRegions.NORTH_AMERICA]: 'ag ai aw bb bm bs bz ca cr cu cw dm do gd gl gt hn ht jm kn ky lc ms mx ni pa pr sv sx tc tt us vc vg vi',
  [CountryRegions.OCEANIA]: 'as au ck fj fm gu ki mh mp nc nf nr nu nz pf pg pn pw sb tk to tv vu ws',
  [CountryRegions.SOUTH_AMERICA]: 'ar bo br cl co ec fk gs gy pe py sr uy ve',
};

const regionsByCode = new Map<string, CountryRegions>();
for (let [ region, codes ] of Object.entries(REGION_CODES) as Array<[CountryRegions, string]>) {
  for (let code of codes.split(' ')) {
    regionsByCode.set(code, region);
  }
}

export function countryRegion(country: Country): CountryRegions {
  return regionsByCode.get(country.code)!;
}


const displayNamesCache = new Map<string, Intl.DisplayNames | null>();

function getDisplayNames(language: string): Intl.DisplayNames | null {
  if (!displayNamesCache.has(language)) {
    let displayNames: Intl.DisplayNames | null = null;
    try {
      displayNames = new Intl.DisplayNames([language], {fallback: 'none', type: 'region'});
    } catch(error) {
      // unknown language tags throw a RangeError
    }
    displayNamesCache.set(language, displayNames);
  }
  return displayNamesCache.get(language)!;
}

// the name to show, in `language` when Intl has one (english overrides only apply to english)
export function countryName(country: Country, language: string): string {
  const isEnglish = language.toLowerCase().split('-').shift() === 'en';
  if (country.name && (isEnglish || country.code.includes('-'))) {
    return country.name;
  }
  if (!country.code.includes('-')) {
    const displayNames = getDisplayNames(language);
    const name = (displayNames) ? displayNames.of(country.code.toUpperCase()) : undefined;
    if (name) {
      return name;
    }
  }
  return country.name || getDisplayNames('en')!.of(country.code.toUpperCase()) || country.code.toUpperCase();
}

// 🇹🇷 from `tr`, subdivisions use the black flag + tag letters sequence (🏴󠁧󠁢󠁳󠁣󠁴󠁿 from `gb-sct`)
export function countryEmoji(country: Country): string {
  if (country.code.includes('-')) {
    const tags = Array.from(country.code.replace('-', '')).map((x) => String.fromCodePoint(0xE0000 + x.charCodeAt(0)));
    return `\u{1F3F4}${tags.join('')}\u{E007F}`;
  }
  return Array.from(country.code.toUpperCase()).map((x) => String.fromCodePoint(0x1F1E6 + x.charCodeAt(0) - 65)).join('');
}


// lowercase without accents, punctuation or spaces, `&` -> and, `st.` -> saint and a leading "the" dropped, so "St. Kitts &
// Nevis", "saint kitts and nevis" and "Saint-Kitts" are all the same
export function normalizeCountryName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bst\b\.?/g, 'saint')
    .replace(/^\s*the\s+/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

// every way of writing a name: as is, without what's in brackets ("Myanmar (Burma)" -> Myanmar, Burma), each side of a
// " - " ("Congo - Kinshasa"), before a comma ("Hong Kong, RAE da China") and before "SAR" ("Hong Kong SAR China")
function nameVariants(name: string): Array<string> {
  const variants = [name];
  if (name.includes(', ')) {
    variants.push(name.split(', ')[0]);
  }
  const bracketed = name.match(/^(.*?)\s*\((.+)\)\s*$/);
  if (bracketed) {
    variants.push(bracketed[1], bracketed[2]);
  }
  if (name.includes(' - ')) {
    variants.push(...name.split(' - '));
  }
  const sar = name.match(/^(.+?)\s+SAR\b/);
  if (sar) {
    variants.push(sar[1]);
  }
  return variants;
}

// every name that counts as an answer for a country, normalized: english (with the aliases) and `languages`' names
export function countryAnswers(country: Country, languages: Array<string>): Set<string> {
  const names = [countryName(country, 'en'), ...(country.aliases || [])];
  if (!country.code.includes('-')) {
    const english = getDisplayNames('en')!.of(country.code.toUpperCase());
    if (english) {
      names.push(english);
    }
  }
  for (let language of languages) {
    names.push(countryName(country, language));
  }
  const answers = new Set<string>();
  for (let name of names) {
    for (let variant of nameVariants(name)) {
      const normalized = normalizeCountryName(variant);
      if (normalized) {
        answers.add(normalized);
      }
    }
  }
  // the flag emoji itself
  answers.add(countryEmoji(country));
  return answers;
}


export function levenshtein(x: string, y: string, max: number): number {
  const a = Array.from(x);
  const b = Array.from(y);
  if (max < Math.abs(a.length - b.length)) {
    return max + 1;
  }
  let previous = Array.from({length: b.length + 1}, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let smallest = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = (a[i - 1] === b[j - 1]) ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      smallest = Math.min(smallest, current[j]);
    }
    // every path is already past the limit
    if (max < smallest) {
      return max + 1;
    }
    previous = current;
  }
  return previous[b.length];
}

// typos allowed for a name this long, short names have to be exact ("Chad", "Oman", "Peru")
function allowedTypos(length: number): number {
  if (length <= 4) {
    return 0;
  }
  if (length <= 8) {
    return 1;
  }
  return 2;
}


export class CountryMatcher {
  answers: Map<string, Set<string>> = new Map();
  countries: ReadonlyArray<Country>;

  // `languages` are the ones whose names count besides english (the game's language)
  constructor(countries: ReadonlyArray<Country>, languages: Array<string>) {
    this.countries = countries;
    // every country, not just the ones in the game, so naming a country that isn't in the pool still counts as naming
    // that country instead of a typo of the answer ("Nigeria" is never a typo of Niger)
    for (let country of Countries) {
      this.answers.set(country.code, countryAnswers(country, languages));
    }
  }

  // the closest any of a country's names is to the guess
  distance(code: string, guess: string, max: number): number {
    let best = max + 1;
    for (let answer of this.answers.get(code)!) {
      if (answer === guess) {
        return 0;
      }
      best = Math.min(best, levenshtein(answer, guess, Math.min(max, best)));
    }
    return best;
  }

  // a guess is right when it's one of the answer's names, or a close enough typo that's closer to it than to any other
  // country's name. A name two countries share ("Congo") is right for both
  isCorrect(country: Country, text: string): boolean {
    const trimmed = text.trim();
    // the flag emoji, before normalizing takes it apart
    const emoji = countryEmoji(country);
    if (trimmed === emoji) {
      return true;
    }
    const guess = normalizeCountryName(trimmed);
    if (!guess) {
      return false;
    }
    const own = this.answers.get(country.code)!;
    if (own.has(guess)) {
      return true;
    }
    const max = allowedTypos(Array.from(guess).length);
    if (!max) {
      return false;
    }
    const distance = this.distance(country.code, guess, max);
    if (max < distance) {
      return false;
    }
    for (let [ code, answers ] of this.answers) {
      if (code === country.code) {
        continue;
      }
      if (answers.has(guess) || this.distance(code, guess, distance) <= distance) {
        return false;
      }
    }
    return true;
  }
}


export function countriesForTier(tier: CountryTiers): Array<Country> {
  return Countries.filter((country) => country.tier <= tier);
}
