import { Interaction } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';

import { Formatter, Parameters } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerFontsRenameCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Rename one of the server\'s saved fonts';
  metadata = {
    id: Formatter.Commands.ServerFontsRename.COMMAND_ID,
  };
  name = 'rename';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'name', description: 'The saved font', required: true, onAutoComplete: Parameters.AutoComplete.savedFontServer},
        {name: 'new-name', description: 'Its new name, letters, numbers and _', label: 'newName', required: true, maxLength: 32},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.ServerFontsRename.CommandArgs) {
    return Formatter.Commands.ServerFontsRename.createMessage(context, args);
  }
}
