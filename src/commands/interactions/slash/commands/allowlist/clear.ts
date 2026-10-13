import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildCommandsAllowlistTypes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clear';

export class CommandsAllowlistClearCommand extends BaseInteractionCommandOption {
  description = 'Clear the command allowlist';
  descriptionLocalizations = I18n.localizations('commands.commands.allowlist.clear.description');
  metadata = {
    id: Formatter.Commands.ModerationCommandsAllowlistClear.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.commands.allowlist.clear.name');

  constructor() {
    super({
      permissions: [Permissions.MANAGE_GUILD],
      options: [
        {name: 'only', description: 'Only clear entries of this type', ...I18n.optionLocalizations('commands.commands.allowlist.clear.only'), choices: Parameters.Slash.oneOf({choices: GuildCommandsAllowlistTypes, localizationKey: 'choices.guild_command_list_types'})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {only?: GuildCommandsAllowlistTypes}) {
    return Formatter.Commands.ModerationCommandsAllowlistClear.createMessage(context, {only: args.only || null});
  }
}
