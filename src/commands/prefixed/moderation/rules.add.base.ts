import { Command, CommandClient, Structures } from 'detritus-client';
import { ChannelTypes, Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, MAX_GUILD_RULE_MESSAGE_LENGTH, StatusEmojis } from '../../../constants';
import { Formatter, I18n, Parameters, ParsedGuildRuleCoverage, displayReply, parseGuildRuleCoverage } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  admins?: boolean,
  channels?: Array<Structures.Channel> | null,
  message?: string,
  roles?: Array<Structures.Role> | null,
  target: ParsedGuildRuleCoverage | null,
  users?: Array<Structures.Member | Structures.User> | null,
}

export interface CommandArgs extends CommandArgsBefore {
  target: ParsedGuildRuleCoverage,
}

export const GUILD_RULE_TARGET_ARGS = [
  {
    aliases: ['channel'],
    name: 'channels',
    type: Parameters.channels({
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
  {
    aliases: ['role'],
    name: 'roles',
    type: Parameters.roles,
  },
  {
    aliases: ['user'],
    name: 'users',
    type: Parameters.membersOrUsers({allowBots: false}),
  },
];

export const GUILD_RULE_TARGET_USAGE = '(-channels ...<channel:id|mention|name>) (-roles ...<role:id|mention|name>) (-users ...<user:id|mention|name>)';

export async function parseGuildRuleCoverageArg(value: string, context: Command.Context): Promise<ParsedGuildRuleCoverage | null> {
  return parseGuildRuleCoverage(context, value);
}

// a mention list that resolved to nothing, so the rule isn't put on the whole server by mistake
export function getMissingTargets(translate: I18n.Translator['translate'], args: CommandArgsBefore): string | null {
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


// `rules block` and `rules allow`
export class RulesAddBaseCommand extends BaseCommand {
  allow: boolean = false;

  constructor(client: CommandClient, options: {aliases: Array<string>, allow: boolean, description: string, name: string}) {
    super(client, {
      name: options.name,

      aliases: options.aliases,
      args: [
        ...GUILD_RULE_TARGET_ARGS,
        ...((options.allow) ? [] : [{name: 'message', aliases: ['m']}]),
        {name: 'admins', type: Boolean},
      ],
      disableDm: true,
      label: 'target',
      metadata: {
        category: CommandCategories.SERVER,
        description: options.description,
        examples: (options.allow) ? [
          `${options.name} ship -roles mods`,
          `${options.name} everything -channels bots`,
          `${options.name} category:fun -users notsobot`,
        ] : [
          `${options.name} fun -channels general -message Fun commands go in #bots`,
          `${options.name} imagine`,
          `${options.name} everything -users notsobot`,
        ],
        id: Formatter.Commands.ModerationRulesAdd.COMMAND_ID,
        usage: `<everything|category|command> ${GUILD_RULE_TARGET_USAGE}${(options.allow) ? '' : ' (-message <text>)'} (-admins)`,
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: parseGuildRuleCoverageArg,
    });
    this.allow = options.allow;
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.target && !(args.channels && !args.channels.length) && !(args.roles && !args.roles.length) && !(args.users && !args.users.length);
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    const error = (args.target) ? getMissingTargets(translate, args) : translate('rules.unknown_target');
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${error}`});
  }

  async run(context: Command.Context, args: CommandArgs) {
    if (args.message && MAX_GUILD_RULE_MESSAGE_LENGTH < args.message.length) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('rules.message_too_long', {max: MAX_GUILD_RULE_MESSAGE_LENGTH})}`});
    }
    return Formatter.Commands.ModerationRulesAdd.createMessage(context, {
      // only the flag itself, `-admins` makes the owner and admins follow it
      admins: (args.admins) ? true : null,
      allow: this.allow,
      ambiguousCategory: args.target.ambiguousCategory,
      channels: args.channels || null,
      coverage: args.target.coverage,
      message: args.message || null,
      roles: args.roles || null,
      users: args.users || null,
    });
  }
}
