import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionMediaCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ffmpeg';

export class MediaAIVToolsFFMPEGCommand extends BaseInteractionMediaCommandOption {
  description = 'Run your own ffmpeg filters and options on a media';
  descriptionLocalizations = I18n.localizations('commands.media_aiv_tools.ffmpeg.description');
  metadata = {
    id: Formatter.Commands.MediaAIVToolsFFMPEG.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_aiv_tools.ffmpeg.name');

  constructor() {
    super({
      options: [
        {
          name: 'options',
          description: 'Like -vf negate -af "volume=2"',
          ...I18n.optionLocalizations('commands.media_aiv_tools.ffmpeg.options'),
          maxLength: 2000,
          value: Parameters.string({maxLength: 2000}),
          required: true,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAIVToolsFFMPEG.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsFFMPEG.createMessage(context, args);
  }
}
