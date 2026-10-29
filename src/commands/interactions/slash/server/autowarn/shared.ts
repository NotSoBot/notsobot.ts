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

// one of the server's discord AutoMod rules, any of them without it
export function automodRuleOption(key: string) {
  return {
    name: 'rule',
    description: 'Only this AutoMod rule (Default: any of them)',
    ...I18n.optionLocalizations(`${key}.rule`),
    onAutoComplete: Parameters.AutoComplete.guildAutomodRules,
    value: Formatter.Commands.ModerationAutowarn.automodRuleParser,
  };
}

// who the rule skips on top of the server's exemption
export function exemptOptions(key: string) {
  return [
    {
      name: 'exempt-roles',
      description: 'Skip members with any of these roles (Mentions or IDs, or none to clear)',
      ...I18n.optionLocalizations(`${key}.exempt_roles`),
      value: Formatter.Commands.ModerationAutowarn.exemptRolesParser,
    },
    {
      name: 'exempt-permissions',
      description: 'Skip members with any of these permissions, like Manage Messages (or none to clear)',
      ...I18n.optionLocalizations(`${key}.exempt_permissions`),
      value: Formatter.Commands.ModerationAutowarn.exemptPermissionsParser,
    },
  ];
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
