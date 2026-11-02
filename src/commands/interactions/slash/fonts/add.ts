import { Interaction, Structures } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class FontsAddCommand extends BaseInteractionCommandOption {
  description = 'Save a font file to use by name';
  metadata = {
    id: Formatter.Commands.FontsAdd.COMMAND_ID,
    premium: true,
  };
  name = 'add';

  constructor() {
    super({
      options: [
        {name: 'name', description: 'Its name, letters, numbers and _', required: true, maxLength: 32},
        {name: 'file', description: 'The font file (.ttf, .otf, .woff, .woff2)', required: true, type: ApplicationCommandOptionTypes.ATTACHMENT},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Omit<Formatter.Commands.FontsAdd.CommandArgs, 'server' | 'url'> & {file?: Structures.Attachment}) {
    const { file, ...rest } = args;
    const url = (file) ? file.url || file.proxyUrl || undefined : undefined;
    return Formatter.Commands.FontsAdd.createMessage(context, {...rest, url});
  }
}
