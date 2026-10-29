import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { MAX_GUILD_WARNING_WEIGHT } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';


// where the rule goes, server-wide without one
export function channelOption(key: string) {
  return {
    name: 'channel',
    description: 'Only in this channel, covers its threads or a category\'s channels (Default: Server-Wide)',
    ...I18n.optionLocalizations(`${key}.channel`),
    value: Parameters.channel({types: Formatter.Commands.ModerationAutowarn.CHANNEL_TYPES as any}),
  };
}

export function warningsOption(key: string) {
  return {
    name: 'warnings',
    description: 'How many warnings it counts as (Default: 1)',
    ...I18n.optionLocalizations(`${key}.warnings`),
    maxValue: MAX_GUILD_WARNING_WEIGHT,
    minValue: 1,
    type: ApplicationCommandOptionTypes.INTEGER,
  };
}
