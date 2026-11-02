import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'chorus';

export class MediaAVAudioChorusCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Add a chorus to an Audio or Video, copies of the sound singing along slightly out of time';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.chorus.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioChorus.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.chorus.name');

  constructor() {
    super({
      options: [
        {name: 'voices', description: 'How many copies sing along, 1 to 3 (Default: 3)', ...I18n.optionLocalizations('commands.media_av.audio.chorus.voices'), type: Number},
        {name: 'delay', description: 'How late the copies are in milliseconds, 1 to 100 (Default: 20)', ...I18n.optionLocalizations('commands.media_av.audio.chorus.delay'), type: 'number'},
        {name: 'rate', description: 'Wobbles per second in Hz, 0.01 to 20 (Default: 1)', ...I18n.optionLocalizations('commands.media_av.audio.chorus.rate'), type: 'number'},
        {name: 'depth', description: 'How far the copies wobble, percent of the delay, 1 to 100 (Default: 50)', ...I18n.optionLocalizations('commands.media_av.audio.chorus.depth'), type: 'number'},
        {name: 'mix', description: 'How much of the copies to use, 0 to 1 (Default: 0.5)', ...I18n.optionLocalizations('commands.media_av.audio.chorus.mix'), type: 'number'},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioChorus.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioChorus.createMessage(context, args);
  }
}
