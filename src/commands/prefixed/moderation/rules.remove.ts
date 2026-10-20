import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { CommandCategories, StatusEmojis } from '../../../constants';
import { Formatter, I18n, ParsedGuildRuleCoverage, displayReply, isSnowflake, parseGuildRuleCoverage } from '../../../utils';

import { BaseCommand } from '../basecommand';

import { CommandArgsBefore as RulesAddArgsBefore, GUILD_RULE_TARGET_ARGS, GUILD_RULE_TARGET_USAGE, getMissingTargets } from './rules.add.base';


export const COMMAND_NAME = 'rules remove';

export interface CommandArgsBefore extends Omit<RulesAddArgsBefore, 'target'> {
  // rule ids from `rules`, or what the rules cover
  target: Array<string> | ParsedGuildRuleCoverage | null,
}

export default class RulesRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['rules delete'],
      args: GUILD_RULE_TARGET_ARGS,
      disableDm: true,
      label: 'target',
      metadata: {
        category: CommandCategories.SERVER,
        description: 'Remove the rules for everything, a category, or a command (or rules by their IDs)',
        examples: [
          `${COMMAND_NAME} fun -channels general`,
          `${COMMAND_NAME} imagine`,
          `${COMMAND_NAME} 1234567890123456789`,
        ],
        id: Formatter.Commands.ModerationRulesRemove.COMMAND_ID,
        usage: `<everything|category|command|...rule-id> ${GUILD_RULE_TARGET_USAGE}`,
      },
      permissions: [Permissions.MANAGE_GUILD],
      type: async (value: string, context: Command.Context) => {
        const ids = value.split(/[\s,]+/).filter(Boolean);
        if (ids.length && ids.every((id) => isSnowflake(id))) {
          return ids;
        }
        return parseGuildRuleCoverage(context, value);
      },
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.target && !(args.channels && !args.channels.length) && !(args.roles && !args.roles.length) && !(args.users && !args.users.length);
  }

  async onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    const error = (args.target) ? getMissingTargets(translate, args as RulesAddArgsBefore) : translate('rules.unknown_target');
    return displayReply(context, {description: `${StatusEmojis.WARNING} ${error}`});
  }

  async run(context: Command.Context, args: CommandArgsBefore) {
    if (Array.isArray(args.target)) {
      return Formatter.Commands.ModerationRulesRemove.createMessage(context, {ruleIds: args.target});
    }
    return Formatter.Commands.ModerationRulesRemove.createMessage(context, {
      channels: args.channels || null,
      coverage: args.target!.coverage,
      roles: args.roles || null,
      users: args.users || null,
    });
  }
}
