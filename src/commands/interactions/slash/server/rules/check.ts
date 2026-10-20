import { Command, Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../../constants';
import { Formatter, I18n, Parameters, displayReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'check';

export interface CommandArgs {
  channel?: Structures.Channel,
  command: Command.Command | false,
  user?: Structures.Member | Structures.User,
}

export class ServerRulesCheckCommand extends BaseInteractionCommandOption {
  description = 'See which rule decides if someone can use a command in a channel';
  descriptionLocalizations = I18n.localizations('commands.rules.check.description');
  metadata = {
    id: Formatter.Commands.ModerationRulesCheck.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.rules.check.name');

  constructor() {
    super({
      options: [
        {
          name: 'command',
          description: 'Command name or ID',
          ...I18n.optionLocalizations('commands.rules.check.command'),
          required: true,
          value: async (value: string, context: Interaction.InteractionContext) => {
            return (await Parameters.prefixedCommand(value, context)) || false;
          },
        },
        {
          name: 'user',
          description: 'User to check for (Default: You)',
          ...I18n.optionLocalizations('commands.rules.check.user'),
          type: ApplicationCommandOptionTypes.USER,
        },
        {
          name: 'channel',
          description: 'Channel to check in (Default: Current Channel)',
          ...I18n.optionLocalizations('commands.rules.check.channel'),
          type: ApplicationCommandOptionTypes.CHANNEL,
          value: (channel: Structures.Channel, context: Interaction.InteractionContext) => {
            return context.channels.get(channel.id) || channel;
          },
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    if (!args.command) {
      const { translate } = await I18n.getTranslator(context);
      return displayReply(context, {description: `${StatusEmojis.WARNING} ${translate('errors.unknown_command')}`, ephemeral: true});
    }
    return Formatter.Commands.ModerationRulesCheck.createMessage(context, {
      channel: args.channel || null,
      command: args.command,
      user: args.user || null,
    });
  }
}
