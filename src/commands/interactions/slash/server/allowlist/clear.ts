import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildAllowlistTypes } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clear';

export class ServerAllowlistClearCommand extends BaseInteractionCommandOption {
  description = 'Clear out the entire allowlist of this server';
  descriptionLocalizations = I18n.localizations('commands.moderation.allowlist.clear.description');
  metadata = {
    id: Formatter.Commands.ModerationAllowlistClear.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.allowlist.clear.name');

  constructor() {
    super({
      permissions: [Permissions.ADMINISTRATOR],
      options: [
        {name: 'only', description: 'Only clear entries of this type', ...I18n.optionLocalizations('commands.moderation.allowlist.clear.only'), choices: Parameters.Slash.oneOf({choices: GuildAllowlistTypes, localizationKey: 'choices.guild_command_list_types'})},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: {only?: GuildAllowlistTypes}) {
    return Formatter.Commands.ModerationAllowlistClear.createMessage(context, {only: args.only || null});
  }
}
