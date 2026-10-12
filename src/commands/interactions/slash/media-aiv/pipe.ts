import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'pipe';

export class MediaAIVPipeCommand extends BaseInteractionMediaCommandOption {
  description = 'Pipe Multiple Media Commands Together';
  descriptionLocalizations = I18n.localizations('commands.media_aiv.pipe.description');
  metadata = {
    id: Formatter.Commands.MediaAIVPipe.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv.pipe.name');

  constructor() {
    super({
      options: [
        {name: 'commands', description: 'Media Commands (ex: flip; flop)', ...I18n.optionLocalizations('commands.media_aiv.pipe.commands'), required: true, value: Parameters.pipingCommands},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVPipe.CommandArgs) {
    return Formatter.Commands.MediaAIVPipe.createMessage(context, args);
  }
}
