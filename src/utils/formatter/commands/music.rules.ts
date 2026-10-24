import { Command, Interaction } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { editGuildMusic, fetchGuildMusic } from '../../../api';
import { StatusEmojis } from '../../../constants';
import { displayDetails, displayReply, formatTime } from '../../../utils';
import { getTranslator } from '../../i18n';

import { MUSIC_QUEUE_PREMIUM_LIMIT, canManageMusic } from './music.shared';


export const COMMAND_ID = 'music.rules';
// the prefixed commands changing one rule, `/music rules` takes both as options
export const COMMAND_ID_DUPLICATES = 'music.rules.duplicates';
export const COMMAND_ID_LENGTH = 'music.rules.length';

export interface CommandArgs {
  // the same track queued more than once at a time (on by default)
  duplicates?: boolean | null,
  // the longest track that can be queued (seconds), 0 for no limit
  maxDuration?: number | null,
}

// the server's queue rules, the ones given are changed first (manage server or the dj role): the longest track and
// duplicates, with how many tracks the queue fits (more for premium servers)
export async function createMessage(context: Command.Context | Interaction.InteractionContext, args: CommandArgs = {}) {
  const { language, translate } = await getTranslator(context);

  const guildId = context.guildId;
  if (!guildId) {
    return displayReply(context, {description: translate('music.nothing_playing')});
  }

  const changing = typeof(args.duplicates) === 'boolean' || typeof(args.maxDuration) === 'number';
  if (changing && !canManageMusic(context.member)) {
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('music_fair.no_permission')}`});
  }
  const music = (changing) ? await editGuildMusic(context, guildId, {
    maxDuration: (typeof(args.maxDuration) === 'number') ? Math.round(args.maxDuration) : undefined,
    noDuplicates: (typeof(args.duplicates) === 'boolean') ? !args.duplicates : undefined,
  }) : await fetchGuildMusic(context, guildId);

  const count = music.queue_limit.toLocaleString(language);
  return displayReply(context, {
    description: displayDetails([
      (music.premium) ?
        translate('music_rules.queue_limit', {count}) :
        translate('music_rules.queue_limit_upgrade', {count, premium: MUSIC_QUEUE_PREMIUM_LIMIT.toLocaleString(language)}),
      (music.max_duration) ?
        translate('music_rules.max_duration', {duration: Markup.codestring(formatTime(music.max_duration * 1000))}) :
        translate('music_rules.any_duration'),
      translate((music.no_duplicates) ? 'music_rules.no_duplicates' : 'music_rules.duplicates'),
    ]),
  });
}
