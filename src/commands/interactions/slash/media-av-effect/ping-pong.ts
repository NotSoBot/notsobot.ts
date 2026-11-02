import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'ping-pong';

export class MediaAVAudioPingPongCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Cut an Audio or Video\'s audio into pieces that each play forwards then backwards';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.ping_pong.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioPingPong.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.ping_pong.name');

  constructor() {
    super({
      options: [
        {name: 'length', description: 'How long each piece is in milliseconds, 10 to 5000 (Default: 250)', ...I18n.optionLocalizations('commands.media_av.audio.ping_pong.length'), type: 'number'},
        {name: 'keep-length', description: 'Play every other piece backwards instead, keeping the length (Default: False)', ...I18n.optionLocalizations('commands.media_av.audio.ping_pong.keep_length'), label: 'keeplength', type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioPingPong.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioPingPong.createMessage(context, args);
  }
}
