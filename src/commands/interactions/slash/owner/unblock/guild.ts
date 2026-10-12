import { Interaction } from 'detritus-client';

import { StatusEmojis } from '../../../../../constants';
import { DefaultParameters, Formatter, I18n, Parameters, editOrReply } from '../../../../../utils';

import { BaseOwnerCommandOption } from '../base';


export const COMMAND_NAME = 'guild';

export class OwnerUnblockGuildCommand extends BaseOwnerCommandOption {
  description = 'Unblock a guild from the bot';
  descriptionLocalizations = I18n.localizations('commands.owner.unblock.guild.description');
  metadata = {
    id: Formatter.Commands.OwnerUnblockGuild.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.unblock.guild.name');

  constructor() {
    super({
      options: [
        {name: 'guild', description: 'Guild ID (Default: Current Guild)', ...I18n.optionLocalizations('commands.owner.unblock.guild.guild'), default: DefaultParameters.guild, value: Parameters.guild},
      ],
    });
  }

  onBeforeRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerUnblockGuild.CommandArgsBefore) {
    return !!args.guild;
  }

  async onCancelRun(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerUnblockGuild.CommandArgsBefore) {
    const { translate } = await I18n.getTranslator(context);
    return editOrReply(context, `${StatusEmojis.WARNING} ${translate('errors.guild_not_found')}`);
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerUnblockGuild.CommandArgs) {
    return Formatter.Commands.OwnerUnblockGuild.createMessage(context, args);
  }
}
