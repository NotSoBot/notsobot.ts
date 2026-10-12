import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseOwnerCommandOption } from './base';


export const COMMAND_NAME = 'upload-commands';

export class OwnerUploadCommandsCommand extends BaseOwnerCommandOption {
  description = 'Upload the bot\'s command information to the website';
  descriptionLocalizations = I18n.localizations('commands.owner.upload_commands.description');
  metadata = {
    id: Formatter.Commands.OwnerUploadCommands.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.upload_commands.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.OwnerUploadCommands.createMessage(context);
  }
}
