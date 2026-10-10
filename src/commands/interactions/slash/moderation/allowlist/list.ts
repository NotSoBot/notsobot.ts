import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildAllowlistTypes } from '../../../../../constants';
import { Formatter, toTitleCase } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class ModerationAllowlistListCommand extends BaseInteractionCommandOption {
  description = 'List all channels/roles/users part of the server\'s allowlist';
  metadata = {
    id: Formatter.Commands.ModerationAllowlist.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {
          name: 'only',
          description: 'Only show this type',
          choices: Object.values(GuildAllowlistTypes).map((value) => ({name: toTitleCase(value), value})),
          default: null,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationAllowlist.CommandArgs) {
    return Formatter.Commands.ModerationAllowlist.createMessage(context, args);
  }
}
