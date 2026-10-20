import { Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, ParsedGuildRuleCoverage, displayReply, isSnowflake } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';

import { coverageOption, getMissingTargets, targetOptions } from './shared';


export const COMMAND_NAME = 'remove';

export interface CommandArgs {
  channels?: Array<Structures.Channel> | null,
  roles?: Array<Structures.Role> | null,
  target: ParsedGuildRuleCoverage | false | string,
  users?: Array<Structures.Member | Structures.User> | null,
}

export class ServerRulesRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove the rules for everything, a category, or a command (or a rule\'s ID)';
  descriptionLocalizations = I18n.localizations('commands.rules.remove.description');
  metadata = {
    id: Formatter.Commands.ModerationRulesRemove.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.rules.remove.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    const target = coverageOption('commands.rules.remove.target');
    super({
      options: [
        {
          ...target,
          // a rule's id from `rules list` works too
          value: async (value: string, context: Interaction.InteractionContext) => {
            if (isSnowflake(value.trim())) {
              return value.trim();
            }
            return target.value(value, context);
          },
        },
        ...targetOptions('commands.rules.remove'),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    const { translate } = await I18n.getTranslator(context);
    if (!args.target) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('rules.unknown_target')}`, ephemeral: true});
    }
    const missing = getMissingTargets(translate, args);
    if (missing) {
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${missing}`, ephemeral: true});
    }
    if (typeof(args.target) === 'string') {
      return Formatter.Commands.ModerationRulesRemove.createMessage(context, {ruleIds: [args.target]});
    }
    return Formatter.Commands.ModerationRulesRemove.createMessage(context, {
      channels: args.channels || null,
      coverage: args.target.coverage,
      roles: args.roles || null,
      users: args.users || null,
    });
  }
}
