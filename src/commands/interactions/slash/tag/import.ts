import { Interaction } from 'detritus-client';
import { ApplicationCommandOptionTypes } from 'detritus-client/lib/constants';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionTagWriteCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'import';

export class TagImportCommand extends BaseInteractionTagWriteCommandOption {
  blockedCommandShouldStillExecute = false;
  description = 'Import tags from a NotSoBot tag export';
  descriptionLocalizations = I18n.localizations('commands.tag.import.description');
  metadata = {
    id: Formatter.Commands.TagImport.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.tag.import.name');

  constructor() {
    super({
      options: [
        {
          name: 'file',
          description: 'Tag export file (.json)',
          ...I18n.optionLocalizations('commands.tag.import.file'),
          required: true,
          type: ApplicationCommandOptionTypes.ATTACHMENT,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext) {
    let url: string | null = null;
    if (context.data.resolved && context.data.resolved.attachments && context.data.resolved.attachments.length) {
      url = context.data.resolved.attachments.first()!.url;
    }
    return Formatter.Commands.TagImport.createMessage(context, {url});
  }
}
