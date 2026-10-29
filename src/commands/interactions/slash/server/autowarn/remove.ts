import { Interaction, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildWarningAutoTriggers } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';

import { automodRuleOption, channelOption } from './shared';


export interface CommandArgs {
  channel?: Structures.Channel | null,
  rule?: Formatter.Commands.ModerationAutowarn.AutomodRuleChoice,
  trigger: GuildWarningAutoTriggers,
}

export class ServerAutowarnRemoveCommand extends BaseInteractionCommandOption {
  description = 'Remove an auto-warn rule, the server-wide one or a channel\'s';
  descriptionLocalizations = I18n.localizations('commands.autowarn.remove.description');
  metadata = {
    id: Formatter.Commands.ModerationAutowarn.COMMAND_ID_REMOVE,
  };
  name = 'remove';
  nameLocalizations = I18n.localizations('commands.autowarn.remove.name');
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {
          name: 'trigger',
          description: 'Which rule',
          ...I18n.optionLocalizations('commands.autowarn.remove.trigger'),
          choices: [
            Parameters.Slash.createChoice('Mentions', GuildWarningAutoTriggers.MENTIONS, {localizationKey: 'moderation_autowarn.choice_mentions'}),
            Parameters.Slash.createChoice('Blocked Commands', GuildWarningAutoTriggers.BLOCKED_COMMAND, {localizationKey: 'moderation_autowarn.choice_blocked_command'}),
            Parameters.Slash.createChoice('AutoMod', GuildWarningAutoTriggers.AUTOMOD, {localizationKey: 'moderation_autowarn.choice_automod'}),
          ],
          required: true,
        },
        channelOption('commands.autowarn.remove'),
        automodRuleOption('commands.autowarn.remove'),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return Formatter.Commands.ModerationAutowarn.createSetMessage(context, {
      automodRule: args.rule,
      channel: args.channel || null,
      remove: true,
      trigger: args.trigger,
    });
  }
}
