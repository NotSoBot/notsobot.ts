import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { StatusEmojis } from '../../../../constants';
import { Formatter, I18n, Parameters, editOrReply } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'guild';

export class InfoGuildCommand extends BaseInteractionCommandOption {
  description = 'Get information for a server';
  descriptionLocalizations = I18n.localizations('commands.info.guild.description');
  metadata = {
    id: Formatter.Commands.InfoGuild.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.info.guild.name');

  constructor() {
    super({
      options: [
        {
          name: 'id',
          description: 'Server ID (Default: Current Server)',
          ...I18n.optionLocalizations('commands.info.guild.id'),
          default: (context: Interaction.InteractionContext) => Parameters.guildMetadata('', context),
          label: 'payload',
          value: Parameters.guildMetadata,
        },
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoGuild.CommandArgsBefore) {
    return !!args.payload.guild;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.InfoGuild.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, {
      content: `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`,
      flags: MessageFlags.EPHEMERAL,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.InfoGuild.CommandArgs) {
    return Formatter.Commands.InfoGuild.createMessage(context, args);
  }
}
