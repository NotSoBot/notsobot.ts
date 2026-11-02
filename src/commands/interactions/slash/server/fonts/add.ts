import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes, Permissions } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export class ServerFontsAddCommand extends BaseInteractionCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Save a font file for everyone here to use by name';
  metadata = {
    id: Formatter.Commands.ServerFontsAdd.COMMAND_ID,
    premiumServer: true,
  };
  name = 'add';
  permissions = [Permissions.MANAGE_GUILD];

  constructor() {
    super({
      options: [
        {name: 'name', description: 'Its name, letters, numbers and _', required: true, maxLength: 32},
        {name: 'file', description: 'The font file (.ttf, .otf, .woff, .woff2)', required: true, type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Omit<Formatter.Commands.ServerFontsAdd.CommandArgs, 'url'> & {file?: Structures.Attachment}) {
    const { file, ...rest } = args;
    const url = (file) ? file.url || file.proxyUrl || undefined : undefined;
    return Formatter.Commands.ServerFontsAdd.createMessage(context, {...rest, url});
  }
}
