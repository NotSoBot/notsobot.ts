import { Interaction } from 'detritus-client';
import { ChannelTypes } from 'detritus-client/lib/constants';

import { I18n, Parameters, parseGuildRuleCoverage } from '../../../../../utils';


// what the rule covers, `everything`, `category:FUN` or `command:ship` from the autocomplete (or typed out)
export function coverageOption(key: string) {
  return {
    name: 'target',
    description: 'Everything, a category, or a command',
    ...I18n.optionLocalizations(key),
    required: true,
    onAutoComplete: Parameters.AutoComplete.guildRuleCoverage,
    value: async (value: string, context: Interaction.InteractionContext) => {
      return (await parseGuildRuleCoverage(context, value)) || false;
    },
  };
}

// who/where, none of them is the whole server
export function targetOptions(key: string) {
  return [
    {
      name: 'channels',
      description: 'Channels (Mentions or IDs, separated by spaces), covers threads and channels in a category',
      ...I18n.optionLocalizations(`${key}.channels`),
      value: Parameters.channels({
        types: [
          ChannelTypes.GUILD_CATEGORY,
          ChannelTypes.GUILD_FORUM,
          ChannelTypes.GUILD_MEDIA,
          ChannelTypes.GUILD_NEWS,
          ChannelTypes.GUILD_STAGE_VOICE,
          ChannelTypes.GUILD_TEXT,
          ChannelTypes.GUILD_VOICE,
        ],
      }),
    },
    {name: 'roles', description: 'Roles (Mentions or IDs, separated by spaces)', ...I18n.optionLocalizations(`${key}.roles`), value: Parameters.roles},
    {name: 'users', description: 'Users (Mentions or IDs, separated by spaces)', ...I18n.optionLocalizations(`${key}.users`), value: Parameters.membersOrUsers({allowBots: false})},
  ];
}

// a mention list that resolved to nothing, so the rule isn't put on the whole server by mistake
export function getMissingTargets(
  translate: I18n.Translator['translate'],
  args: {channels?: Array<any> | null, roles?: Array<any> | null, users?: Array<any> | null},
): string | null {
  const errors: Array<string> = [];
  if (args.channels && !args.channels.length) {
    errors.push(translate('moderation.types.channel').toLowerCase());
  }
  if (args.roles && !args.roles.length) {
    errors.push(translate('moderation.types.role').toLowerCase());
  }
  if (args.users && !args.users.length) {
    errors.push(translate('moderation.types.user').toLowerCase());
  }
  return (errors.length) ? translate('moderation.items_not_found', {items: errors.join(', ')}) : null;
}
