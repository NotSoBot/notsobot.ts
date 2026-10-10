import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'clear';

export class ModerationAllowlistClearCommand extends BaseInteractionCommandOption {
  description = 'Clear out the entire allowlist of this server';
  metadata = {
    id: Formatter.Commands.ModerationAllowlistClear.COMMAND_ID,
  };
  name = COMMAND_NAME;

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
