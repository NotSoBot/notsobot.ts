import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'identify';

export class MediaAVToolsIdentifyCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Identify a song in an audio or video file';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.identify.description');
  metadata = {
    id: Formatter.Commands.MediaAVToolsIdentify.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.identify.name');

  constructor() {
	  super({
	    options: [
		    {
		      name: 'start',
		      description: 'Starting Timestamp',
		      ...I18n.optionLocalizations('commands.media_av.audio.identify.start'),
		      value: Parameters.secondsWithOptions({negatives: true}),
		    },
	    ],
	  });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVToolsIdentify.CommandArgs) {
    return Formatter.Commands.MediaAVToolsIdentify.createMessage(context, args);
  }
}
