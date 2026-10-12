import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clear';

export class ModerationAllowlistClearCommand extends BaseInteractionCommandOption {
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
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.ModerationAllowlistClear.createMessage(context, {only: null});
  }
}
