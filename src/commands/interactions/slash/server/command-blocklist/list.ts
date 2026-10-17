import { Interaction } from 'detritus-client';

import { GuildCommandsBlocklistTypes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class ServerCommandBlocklistListCommand extends BaseInteractionCommandOption {
  description = 'List all blocklisted commands (and their associated type)';
  descriptionLocalizations = I18n.localizations('commands.commands.blocklist.list.description');
  metadata = {
    id: Formatter.Commands.ModerationCommandsBlocklist.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.commands.blocklist.list.name');

  constructor() {
    super({
      options: [
        {name: 'only', description: 'Only show entries of this type', ...I18n.optionLocalizations('commands.commands.blocklist.list.only'), choices: Parameters.Slash.oneOf({choices: GuildCommandsBlocklistTypes, localizationKey: 'choices.guild_command_list_types'})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {only?: GuildCommandsBlocklistTypes}) {
    return Formatter.Commands.ModerationCommandsBlocklist.createMessage(context, {only: args.only || null});
  }
}
