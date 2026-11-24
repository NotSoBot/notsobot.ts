import { Command, Interaction } from 'detritus-client';

import GuildSettingsStore from '../../../stores/guildsettings';
import { getServerPremiumUsers } from '../../../stores/premiumservers';
import { editGuildSettings } from '../../../api';
import { GuildSettingsChild } from '../../../api/structures/guildsettings';
import {
  DiscordSkuIds,
  GuildAutoEmbedSites,
  GuildAutoEmbedSitesToText,
  PostGalleryTypes,
  PostGalleryViews,
  PostGalleryViewsToTypes,
  StatusEmojis,
} from '../../../constants';
import { Translator, getCachedTranslator, getTranslator } from '../../i18n';
import { displayDetailsLine, displayReply, linkPremiumSkuName } from '../../../utils';
import { UserError } from '../../errors';


export const COMMAND_ID = 'server.set.autoembed';

// what `embed` takes in the prefixed command, english like the other flags
export const EMBED_ON_VALUES = ['on', 'true', 'yes', 'enable', '1'];
export const EMBED_OFF_VALUES = ['off', 'false', 'no', 'disable', '0'];

// the order they're shown in, with what the prefixed command takes for each besides its value
export const SITES: Array<{site: GuildAutoEmbedSites, values: Array<string>}> = [
  {site: GuildAutoEmbedSites.TIKTOK, values: ['tiktok', 'tt']},
  {site: GuildAutoEmbedSites.INSTAGRAM, values: ['instagram', 'ig', 'insta']},
  {site: GuildAutoEmbedSites.X, values: ['x', 'twitter']},
  {site: GuildAutoEmbedSites.REDDIT, values: ['reddit']},
  {site: GuildAutoEmbedSites.BLUESKY, values: ['bluesky', 'bsky']},
  {site: GuildAutoEmbedSites.THREADS, values: ['threads']},
  {site: GuildAutoEmbedSites.FACEBOOK, values: ['facebook', 'fb']},
  {site: GuildAutoEmbedSites.PINTEREST, values: ['pinterest']},
  {site: GuildAutoEmbedSites.TUMBLR, values: ['tumblr']},
  {site: GuildAutoEmbedSites.STREAMABLE, values: ['streamable']},
];

export interface CommandArgs {
  // turns auto-embed (for every site, or just `site`) on or off
  embed?: boolean,
  // how posts with more than one media show, null: each poster's own setting (then the server's `post-gallery`)
  gallery?: PostGalleryTypes | null,
  // members with premium can auto-embed their own links for the sites the server doesn't (on by default)
  members?: boolean,
  // a post that's only text is drawn as a screenshot of the post, not posted as its text (off by default)
  screenshot?: boolean,
  site?: GuildAutoEmbedSites,
  // posts the post's text (author, caption) with the media too
  text?: boolean,
}

function listSiteValues(): string {
  return SITES.map((x) => x.site).join(', ');
}

export function embedParser(value: string, context: Command.Context | Interaction.InteractionContext): boolean | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (EMBED_ON_VALUES.includes(text)) {
    return true;
  }
  if (EMBED_OFF_VALUES.includes(text)) {
    return false;
  }
  throw new UserError(getCachedTranslator(context).translate('settings_server_autoembed.invalid_embed'));
}

export function textParser(value: string, context: Command.Context | Interaction.InteractionContext): boolean | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (EMBED_ON_VALUES.includes(text)) {
    return true;
  }
  if (EMBED_OFF_VALUES.includes(text)) {
    return false;
  }
  throw new UserError(getCachedTranslator(context).translate('settings_server_autoembed.invalid_text'));
}

export function membersParser(value: string, context: Command.Context | Interaction.InteractionContext): boolean | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (EMBED_ON_VALUES.includes(text)) {
    return true;
  }
  if (EMBED_OFF_VALUES.includes(text)) {
    return false;
  }
  throw new UserError(getCachedTranslator(context).translate('settings_server_autoembed.invalid_members'));
}

export function screenshotParser(value: string, context: Command.Context | Interaction.InteractionContext): boolean | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (EMBED_ON_VALUES.includes(text)) {
    return true;
  }
  if (EMBED_OFF_VALUES.includes(text)) {
    return false;
  }
  throw new UserError(getCachedTranslator(context).translate('settings_server_autoembed.invalid_screenshot'));
}

// `gallery`, `pages`, or `default` (each poster's setting), the prefixed command's `-gallery` and the slash choices
export const GALLERY_DEFAULT_VALUE = 'default';

export function galleryParser(value: string, context: Command.Context | Interaction.InteractionContext): PostGalleryTypes | null | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  if (text === GALLERY_DEFAULT_VALUE) {
    return null;
  }
  if (text in PostGalleryViewsToTypes) {
    return PostGalleryViewsToTypes[text as PostGalleryViews];
  }
  throw new UserError(getCachedTranslator(context).translate('settings_server_autoembed.invalid_gallery'));
}

export function siteParser(value: string, context: Command.Context | Interaction.InteractionContext): GuildAutoEmbedSites | undefined {
  const text = value.trim().toLowerCase();
  if (!text) {
    return undefined;
  }
  const item = SITES.find((x) => x.values.includes(text));
  if (item) {
    return item.site;
  }
  throw new UserError(getCachedTranslator(context).translate('settings_server_autoembed.invalid_site', {sites: listSiteValues()}));
}

// the prefixed command's content: `on`, `off tiktok`, ...
export function contentParser(value: string, context: Command.Context | Interaction.InteractionContext): CommandArgs {
  const [ embed, site, ...rest ] = value.trim().split(/\s+/).filter(Boolean);
  if (rest.length) {
    throw new UserError(getCachedTranslator(context).translate('settings_server_autoembed.invalid_embed'));
  }
  return {
    embed: (embed) ? embedParser(embed, context) : undefined,
    site: (site) ? siteParser(site, context) : undefined,
  };
}

// the slash command's `site` choices are the site's value
export function siteSlashParser(value: string): GuildAutoEmbedSites | undefined {
  const item = SITES.find((x) => x.site === value);
  return (item) ? item.site : undefined;
}

export function formatAutoEmbed(translator: Translator, settings: GuildSettingsChild): string {
  const { translate } = translator;
  const enabled = SITES.filter((x) => settings.autoEmbed.includes(x.site));
  // members' own auto-embed works without the server's sites (or a slot), so it's always shown
  const members = translate((settings.autoEmbedMembers) ? 'settings_server_autoembed.members_on' : 'settings_server_autoembed.members_off');
  if (enabled.length) {
    const lines = [
      translate('settings_server_autoembed.sites', {sites: displayDetailsLine(enabled.map((x) => GuildAutoEmbedSitesToText[x.site]))}),
      translate((settings.autoEmbedText) ? 'settings_server_autoembed.text_on' : 'settings_server_autoembed.text_off'),
      // off is the default and changes nothing, only said when it's on (and the text is, it replaces the text reply)
      (settings.autoEmbedScreenshot && settings.autoEmbedText) ? translate('settings_server_autoembed.screenshot_on') : '',
      translate(
        (settings.autoEmbedGallery === PostGalleryTypes.GALLERY) ? 'settings_server_autoembed.gallery_gallery' :
        (settings.autoEmbedGallery === PostGalleryTypes.PAGES) ? 'settings_server_autoembed.gallery_pages' :
        'settings_server_autoembed.gallery_default',
      ),
      members,
    ].filter(Boolean);
    return lines.join('\n-> ');
  }
  return [translate('settings_server_autoembed.sites_none'), members].join('\n-> ');
}

// shows the sites with nothing given, otherwise turns all of them (or `site`) on or off. it's saved without premium
// too, the note says it only works with a slot (kept for when the server gets one back, like music's premium perks)
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { translate } = translator;

  const changingEmbed = args.embed !== undefined && args.embed !== null;
  const changingText = args.text !== undefined && args.text !== null;
  const changingMembers = args.members !== undefined && args.members !== null;
  // null is a change too, back to each poster's setting
  const changingGallery = args.gallery !== undefined;
  const changingScreenshot = args.screenshot !== undefined && args.screenshot !== null;
  const changing = changingEmbed || changingText || changingMembers || changingGallery || changingScreenshot;
  if (args.site && !changingEmbed) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_autoembed.site_without_embed')}`, ephemeral: true});
  }

  let settings: GuildSettingsChild;
  let title: string;
  if (changing) {
    // one site flips on top of what's there, so that needs the current sites too
    let sites: Array<string> | undefined;
    if (!changingEmbed) {
      // only the text, gallery, members or screenshot setting changes
    } else if (args.site) {
      const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
      if (!guildSettings) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_set_warnings.error_fetching')}`, ephemeral: true});
      }
      sites = guildSettings.settings.autoEmbed.filter((x) => x !== args.site);
      if (args.embed) {
        sites.push(args.site);
      }
    } else {
      sites = (args.embed) ? SITES.map((x) => x.site) : [];
    }
    ({ settings } = await editGuildSettings(context, context.guildId!, {
      autoEmbed: sites,
      autoEmbedGallery: (changingGallery) ? args.gallery : undefined,
      autoEmbedMembers: (changingMembers) ? args.members : undefined,
      autoEmbedScreenshot: (changingScreenshot) ? args.screenshot : undefined,
      autoEmbedText: (changingText) ? args.text : undefined,
    }));
    title = translate('settings_server_autoembed.updated');
  } else {
    const guildSettings = await GuildSettingsStore.getOrFetch(context, context.guildId!);
    if (!guildSettings) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_set_warnings.error_fetching')}`, ephemeral: true});
    }
    settings = guildSettings.settings;
    title = translate('settings_server_autoembed.current');
  }

  const lines = [title, `-> ${formatAutoEmbed(translator, settings)}`];
  if (settings.autoEmbed.length && !(await getServerPremiumUsers(context)).length) {
    const note = translate('settings_server_autoembed.premium_note');
    lines.push(`-# ${linkPremiumSkuName(context, note, DiscordSkuIds.USER_NOTSOPREMIUM_PLUS)}`);
  }
  return displayReply(context, {description: lines.join('\n'), ephemeral: true});
}
