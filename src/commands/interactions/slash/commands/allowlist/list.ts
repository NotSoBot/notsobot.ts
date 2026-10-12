import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildCommandsAllowlistTypes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class CommandsAllowlistListCommand extends BaseInteractionCommandOption {
  description = 'List all allowlisted commands (and their associated type)';
  descriptionLocalizations = I18n.localizations('commands.commands.allowlist.list.description');
  metadata = {
    id: Formatter.Commands.ModerationCommandsAllowlist.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.commands.allowlist.list.name');

  constructor() {
    super({
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {name: 'only', description: 'Only show entries of this type', ...I18n.optionLocalizations('commands.commands.allowlist.list.only'), choices: Parameters.Slash.oneOf({choices: GuildCommandsAllowlistTypes, localizationKey: 'choices.guild_command_list_types'})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {only?: GuildCommandsAllowlistTypes}) {
    return Formatter.Commands.ModerationCommandsAllowlist.createMessage(context, {only: args.only || null});
  }
}
