import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerFontsRemoveCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Remove one of the server\'s saved fonts';
  metadata = {
    id: Formatter.Commands.ServerFontsRemove.COMMAND_ID,
  };
  name = 'remove';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'name', description: 'The saved font', required: true, onAutoComplete: Parameters.AutoComplete.savedFontServer},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ServerFontsRemove.CommandArgs) {
    return Formatter.Commands.ServerFontsRemove.createMessage(context, args);
  }
}
