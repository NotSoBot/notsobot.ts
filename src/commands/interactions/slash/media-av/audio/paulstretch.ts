import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'paulstretch';

export class MediaAVAudioPaulstretchCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Stretch an Audio or Video into a slow, smeared ambient drone, like Audacity\'s Paulstretch';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.paulstretch.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioPaulstretch.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.paulstretch.name');

  constructor() {
    super({
      options: [
        {name: 'stretch', description: 'How many times longer it gets, 1 to 50 (Default: 2.0)', ...I18n.optionLocalizations('commands.media_av.audio.paulstretch.stretch'), type: 'number'},
        {name: 'resolution', description: 'Seconds of sound smeared together, 0.01 to 10, bigger is smoother (Default: 1.6)', ...I18n.optionLocalizations('commands.media_av.audio.paulstretch.resolution'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioPaulstretch.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioPaulstretch.createMessage(context, args);
  }
}
