import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { GuildBlocklistTypes } from '../../../../../constants';
import { Formatter, toTitleCase } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'list';

export class ModerationBlocklistListCommand extends BaseInteractionCommandOption {
  description = 'List all channels/roles/users part of the server\'s blocklist';
  metadata = {
    id: Formatter.Commands.ModerationBlocklist.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      permissionsClient: [Permissions.EMBED_LINKS],
      options: [
        {
          name: 'only',
          description: 'Only show this type',
          choices: Object.values(GuildBlocklistTypes).map((value) => ({name: toTitleCase(value), value})),
          default: null,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ModerationBlocklist.CommandArgs) {
    return Formatter.Commands.ModerationBlocklist.createMessage(context, args);
  }
}
