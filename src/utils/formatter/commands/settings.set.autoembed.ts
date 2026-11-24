import { Command, Interaction } from 'detritus-client';

import UserSettingsStore from '../../../stores/usersettings';
import { editUserSettings } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { DiscordSkuIds, GuildAutoEmbedSites, GuildAutoEmbedSitesToText, StatusEmojis } from '../../../constants';
import { Translator, getTranslator } from '../../i18n';
import { displayDetailsLine, displayReply, getPremiumUpsellSku, linkPremiumSkuName } from '../../../utils';

import { SITES } from './settings.server.set.autoembed';


export const COMMAND_ID = 'settings.set.autoembed';

export interface CommandArgs {
  // turns auto-embed of their own links (for every site, or just `site`) on or off
  embed?: boolean,
  // a post that's only text is drawn as a screenshot of the post, not posted as its text (off by default)
  screenshot?: boolean,
  site?: GuildAutoEmbedSites,
  // posts the post's text (author, caption) with the media too (on by default)
  text?: boolean,
}

function formatAutoEmbed(translator: Translator, settings: RestResponsesRaw.UserSettings): string {
  const { translate } = translator;
  const sites = settings.auto_embed || [];
  const enabled = SITES.filter((x) => sites.includes(x.site));
  if (!enabled.length) {
    return translate('settings_set_autoembed.sites_none');
  }
  return [
    translate('settings_set_autoembed.sites', {sites: displayDetailsLine(enabled.map((x) => GuildAutoEmbedSitesToText[x.site]))}),
    translate((settings.auto_embed_text !== false) ? 'settings_server_autoembed.text_on' : 'settings_server_autoembed.text_off'),
    // off is the default and changes nothing, only said when it's on (and the text is, it replaces the text reply)
    (settings.auto_embed_screenshot === true && settings.auto_embed_text !== false) ? translate('settings_server_autoembed.screenshot_on') : '',
  ].filter(Boolean).join('\n-> ');
}

// auto-embed for their own links (a premium perk, any tier): a message of theirs whose only link is to a post on one of the sites
// gets the media posted like `download`, in servers the bot is in that allow it (`/server set auto-embed members`). A
// server's own auto-embed settings win for the sites it turned on. saved without premium too (kept for when they get
// it back), the note says it needs premium
export async function createMessage(
  context: Command.Context | Interaction.InteractionContext,
  args: CommandArgs,
) {
  const translator = await getTranslator(context);
  const { translate } = translator;

  const changingEmbed = args.embed !== undefined && args.embed !== null;
  const changingText = args.text !== undefined && args.text !== null;
  const changingScreenshot = args.screenshot !== undefined && args.screenshot !== null;
  if (args.site && !changingEmbed) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_server_autoembed.site_without_embed')}`, ephemeral: true});
  }

  let settings: RestResponsesRaw.UserSettings | null;
  let title: string;
  if (changingEmbed || changingText || changingScreenshot) {
    // one site flips on top of what's there, so that needs the current sites too
    let sites: Array<string> | undefined;
    if (!changingEmbed) {
      // only the text or screenshot setting changes
    } else if (args.site) {
      const current = await UserSettingsStore.getOrFetch(context, context.userId);
      if (!current) {
        return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_set_autoembed.error_fetching')}`, ephemeral: true});
      }
      sites = (current.auto_embed || []).filter((x) => x !== args.site);
      if (args.embed) {
        sites.push(args.site);
      }
    } else {
      sites = (args.embed) ? SITES.map((x) => x.site) : [];
    }
    settings = await editUserSettings(context, context.userId, {
      autoEmbed: sites,
      autoEmbedScreenshot: (changingScreenshot) ? args.screenshot : undefined,
      autoEmbedText: (changingText) ? args.text : undefined,
    });
    UserSettingsStore.insert(context.userId, settings);
    title = translate('settings_set_autoembed.updated');
  } else {
    settings = await UserSettingsStore.getOrFetch(context, context.userId);
    if (!settings) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('settings_set_autoembed.error_fetching')}`, ephemeral: true});
    }
    title = translate('settings_set_autoembed.current');
  }

  const lines = [title, `-> ${formatAutoEmbed(translator, settings)}`];
  if ((settings.auto_embed || []).length) {
    lines.push(`-# ${translate('settings_set_autoembed.where_note')}`);
    if (await getPremiumUpsellSku(context, DiscordSkuIds.USER_NOTSOPREMIUM)) {
      const note = translate('settings_set_autoembed.premium_note');
      lines.push(`-# ${linkPremiumSkuName(context, note, DiscordSkuIds.USER_NOTSOPREMIUM)}`);
    }
  }
  return displayReply(context, {description: lines.join('\n'), ephemeral: true});
}
