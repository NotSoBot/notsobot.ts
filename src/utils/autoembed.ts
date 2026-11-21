import { Command } from 'detritus-client';

import { GuildAutoEmbedSites } from '../constants';


// auto-embed, a premium server perk: a message whose only link is to a post on one of the server's `settings.autoEmbed`
// sites goes to `download` like `.dl <link>` was used (see `NotSoCommandClient.getAutoEmbedLink`). only links to a post on
// each site match, so a profile or a home page someone shares doesn't get a failed download (and a reaction) every time.
// Premium users can turn it on for their own links too (`UserSettings.auto_embed`), for the sites the server doesn't

export interface AutoEmbedLinkMatch {
  site: GuildAutoEmbedSites,
  // the link was in `||spoiler||` bars, the download is sent as a spoiler too
  spoiler: boolean,
  url: string,
}

// whose auto-embed setting it went by, the text setting comes from the same place
export enum AutoEmbedSources {
  SERVER = 'server',
  USER = 'user',
}

export interface AutoEmbedLink extends AutoEmbedLinkMatch {
  source: AutoEmbedSources,
}


// longer than any post link, anything past this isn't one
const MAX_LINK_LENGTH = 512;
// a nitro message's limit, it's only ever a quick scan for links
const MAX_CONTENT_LENGTH = 4000;

// `inline code`, ``double ticks`` and ```code blocks```
const CODE_REGEX = /```[\s\S]*?```|``[^`]+?``|`[^`\n]+?`/g;
// a link like Discord finds one: http(s):// up to whitespace or `<`/`>`, what's stuck to its end is trimmed after
const LINK_REGEX = /https?:\/\/[^\s<>]+/gi;
const TRAILING_CHARACTERS = ['.', ',', '!', '?', ':', ';', '\'', '"', '*', '_', '~', '|'];

// pinterest has a domain per country (pinterest.co.uk, pinterest.com.mx, pinterest.de...)
const PINTEREST_HOST = /(?:^|\.)pinterest\.(?:com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/;


// the host or a subdomain of it (www., m., old....)
function isHost(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}


const SITE_MATCHERS: Array<{site: GuildAutoEmbedSites, test: (hostname: string, url: URL) => boolean}> = [
  {
    site: GuildAutoEmbedSites.BLUESKY,
    test: (hostname, url) => isHost(hostname, 'bsky.app') && /^\/profile\/[^/]+\/post\/[^/]+\/?$/.test(url.pathname),
  },
  {
    site: GuildAutoEmbedSites.FACEBOOK,
    test: (hostname, url) => {
      if (hostname === 'fb.watch') {
        return /^\/[\w-]+\/?$/.test(url.pathname);
      }
      if (!isHost(hostname, 'facebook.com')) {
        return false;
      }
      // reels, share links, a page's videos, and `watch?v=` / `video.php?v=`
      if (/^\/(?:reels?\/\d+|share\/[rv]\/[\w-]+|[^/]+\/videos\/(?:[^/]+\/)?\d+)/.test(url.pathname)) {
        return true;
      }
      return /^\/(?:watch|video\.php)\/?$/.test(url.pathname) && url.searchParams.has('v');
    },
  },
  {
    site: GuildAutoEmbedSites.INSTAGRAM,
    // posts, reels and igtv (with or without the account's name first), and share links
    test: (hostname, url) => isHost(hostname, 'instagram.com') && /^\/(?:[\w.]+\/)?(?:p|reels?|tv)\/[\w-]+|^\/share\/(?:(?:p|reels?)\/)?[\w-]+/.test(url.pathname),
  },
  {
    site: GuildAutoEmbedSites.PINTEREST,
    test: (hostname, url) => {
      if (hostname === 'pin.it') {
        return /^\/[\w-]+\/?$/.test(url.pathname);
      }
      return PINTEREST_HOST.test(hostname) && /^\/pin\/[\w-]+/.test(url.pathname);
    },
  },
  {
    site: GuildAutoEmbedSites.REDDIT,
    test: (hostname, url) => {
      // i.redd.it and preview.redd.it are the images themselves, discord embeds those fine
      if (hostname === 'redd.it' || hostname === 'v.redd.it') {
        return /^\/\w+\/?$/.test(url.pathname);
      }
      return isHost(hostname, 'reddit.com') && /^\/(?:r|u|user)\/[^/]+\/(?:comments\/\w+|s\/\w+)/.test(url.pathname);
    },
  },
  {
    site: GuildAutoEmbedSites.STREAMABLE,
    test: (hostname, url) => isHost(hostname, 'streamable.com') && /^\/(?:[eo]\/)?\w+\/?$/.test(url.pathname),
  },
  {
    site: GuildAutoEmbedSites.THREADS,
    test: (hostname, url) => (isHost(hostname, 'threads.net') || isHost(hostname, 'threads.com')) && /^\/@[^/]+\/post\/[\w-]+/.test(url.pathname),
  },
  {
    site: GuildAutoEmbedSites.TIKTOK,
    test: (hostname, url) => {
      // short links, anything after the domain is the code
      if (hostname === 'vm.tiktok.com' || hostname === 'vt.tiktok.com') {
        return /^\/\w+\/?$/.test(url.pathname);
      }
      return isHost(hostname, 'tiktok.com') && /^\/(?:@[^/]+\/(?:video|photo)\/\d+|t\/\w+|v\/\d+)/.test(url.pathname);
    },
  },
  {
    site: GuildAutoEmbedSites.TUMBLR,
    test: (hostname, url) => {
      if (hostname === 'tumblr.com' || hostname === 'www.tumblr.com') {
        return /^\/[\w-]+\/\d+/.test(url.pathname);
      }
      // the blog's own subdomain
      return isHost(hostname, 'tumblr.com') && /^\/post\/\d+/.test(url.pathname);
    },
  },
  {
    site: GuildAutoEmbedSites.X,
    test: (hostname, url) => {
      if (!isHost(hostname, 'x.com') && !isHost(hostname, 'twitter.com')) {
        return false;
      }
      return /^\/(?:\w+|i(?:\/web)?)\/status(?:es)?\/\d+/.test(url.pathname);
    },
  },
];


/**
 * The post link a message has, if it's the only link in it: one link on its own or with text around it, in spoiler bars
 * or not. A link in `<angle brackets>` doesn't count, that's someone asking for no embed, and neither does one in a code
 * span or block (Discord doesn't preview those either). A message with more than one link is left alone, picking one of
 * them would be a guess. `null` for anything else, including links to sites that aren't in the list
 */
export function findAutoEmbedLink(content: string): AutoEmbedLinkMatch | null {
  if (!content || MAX_CONTENT_LENGTH < content.length) {
    return null;
  }
  // code spans and blocks out (same length, so the spoiler bars' positions still line up), their links don't count
  const text = content.replace(CODE_REGEX, (code) => ' '.repeat(code.length));

  let found: {index: number, raw: string} | null = null;
  for (let match of text.matchAll(LINK_REGEX)) {
    if (found) {
      return null;
    }
    found = {index: match.index!, raw: match[0]};
  }
  if (!found) {
    return null;
  }

  const link = trimLink(found.raw);
  if (!link || MAX_LINK_LENGTH < link.length) {
    return null;
  }
  // `<link>` and a masked `[text](<link>)` ask for no preview
  if (text[found.index - 1] === '<' && text[found.index + link.length] === '>') {
    return null;
  }

  let url: URL;
  try {
    url = new URL(link);
  } catch(error) {
    return null;
  }
  if (url.username || url.password || url.port) {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  for (let matcher of SITE_MATCHERS) {
    if (matcher.test(hostname, url)) {
      return {site: matcher.site, spoiler: isInSpoiler(text, found.index, found.index + link.length), url: link};
    }
  }
  return null;
}


// what's stuck to the end of a link that isn't part of it: punctuation ending a sentence, markdown around it (`**`,
// `__`, `~~`, `||`), and a `)` or `]` with no opening one in the link (a masked link's or one in brackets)
function trimLink(raw: string): string {
  let link = raw;
  while (link) {
    const last = link[link.length - 1];
    if (TRAILING_CHARACTERS.includes(last)) {
      link = link.slice(0, -1);
    } else if ((last === ')' || last === ']') && countOf(link, last) > countOf(link, (last === ')') ? '(' : '[')) {
      link = link.slice(0, -1);
    } else {
      break;
    }
  }
  return link;
}

function countOf(text: string, character: string): number {
  let count = 0;
  for (let x of text) {
    if (x === character) {
      count++;
    }
  }
  return count;
}

// in `||spoiler bars||`: they pair up in order like Discord's markdown, the link has to be inside one pair
function isInSpoiler(text: string, start: number, end: number): boolean {
  let open = -1;
  let index = text.indexOf('||');
  while (index !== -1) {
    if (open === -1) {
      open = index;
    } else {
      if (open < start && end <= index) {
        return true;
      }
      open = -1;
    }
    index = text.indexOf('||', index + 2);
  }
  return false;
}


// set on the context of a message that's going to `download` as an auto-embed
export function getAutoEmbedLink(context: Command.Context): AutoEmbedLink | null {
  return (context.metadata && context.metadata.autoEmbed) || null;
}
