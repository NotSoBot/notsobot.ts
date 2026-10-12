import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clear';

export class ModerationBlocklistClearCommand extends BaseInteractionCommandOption {
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
      permissionsClient: [Permissions.EMBED_LINKS],
    });
  }

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.ModerationBlocklistClear.createMessage(context, {only: null});
  }
}
