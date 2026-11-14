import { Command } from 'detritus-client';

import { GuildAutoEmbedSites } from '../constants';


// auto-embed, a premium server perk: a message that's only a link to one of the server's `settings.autoEmbed` sites
// goes to `download` like `.dl <link>` was used (see `NotSoCommandClient.getAutoEmbedLink`). only links to a post on
// each site match, so a profile or a home page someone shares doesn't get a failed download (and a reaction) every time

export interface AutoEmbedLink {
  site: GuildAutoEmbedSites,
  // the link was in `||spoiler||` bars, the download is sent as a spoiler too
  spoiler: boolean,
  url: string,
}


// longer than any post link, anything past this isn't one
const MAX_LINK_LENGTH = 512;

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
 * The post link a message is made of, if that's all it is: one link with nothing else around it, or one in spoiler
 * bars. A link in `<angle brackets>` doesn't count, that's someone asking for no embed. `null` for anything else,
 * including links to sites that aren't in the list
 */
export function findAutoEmbedLink(content: string): AutoEmbedLink | null {
  let text = content.trim();
  if (!text || MAX_LINK_LENGTH + 4 < text.length) {
    return null;
  }

  let spoiler = false;
  if (4 < text.length && text.startsWith('||') && text.endsWith('||')) {
    text = text.slice(2, -2).trim();
    spoiler = true;
  }
  if (MAX_LINK_LENGTH < text.length || /\s/.test(text) || !/^https?:\/\//i.test(text)) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(text);
  } catch(error) {
    return null;
  }
  if (url.username || url.password || url.port) {
    return null;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  for (let matcher of SITE_MATCHERS) {
    if (matcher.test(hostname, url)) {
      return {site: matcher.site, spoiler, url: text};
    }
  }
  return null;
}


// set on the context of a message that's going to `download` as an auto-embed
export function getAutoEmbedLink(context: Command.Context): AutoEmbedLink | null {
  return (context.metadata && context.metadata.autoEmbed) || null;
}
