import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildCommandsBlocklistTypes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clear';

export class CommandsBlocklistClearCommand extends BaseInteractionCommandOption {
  description = 'Clear the command blocklist';
  descriptionLocalizations = I18n.localizations('commands.commands.blocklist.clear.description');
  metadata = {
    id: Formatter.Commands.ModerationCommandsBlocklistClear.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.commands.blocklist.clear.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_GUILD],
      options: [
        {name: 'only', description: 'Only clear entries of this type', ...I18n.optionLocalizations('commands.commands.blocklist.clear.only'), choices: Parameters.Slash.oneOf({choices: GuildCommandsBlocklistTypes, localizationKey: 'choices.guild_command_list_types'})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {only?: GuildCommandsBlocklistTypes}) {
    return Formatter.Commands.ModerationCommandsBlocklistClear.createMessage(context, {only: args.only || null});
  }
}
