import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildBlocklistTypes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clear';

export class ServerBlocklistClearCommand extends BaseInteractionCommandOption {
  description = 'Clear out the entire blocklist of this server';
  descriptionLocalizations = I18n.localizations('commands.moderation.blocklist.clear.description');
  metadata = {
    id: Formatter.Commands.ModerationBlocklistClear.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.blocklist.clear.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      options: [
        {name: 'only', description: 'Only clear entries of this type', ...I18n.optionLocalizations('commands.moderation.blocklist.clear.only'), choices: Parameters.Slash.oneOf({choices: GuildBlocklistTypes, localizationKey: 'choices.guild_command_list_types'})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {only?: GuildBlocklistTypes}) {
    return Formatter.Commands.ModerationBlocklistClear.createMessage(context, {only: args.only || null});
  }
}
