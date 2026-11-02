import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionAudioOrVideoCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'sentence-mix';

export class MediaAVAudioSentenceMixCommand extends BaseInteractionAudioOrVideoCommandOption {
  description = 'Make an Audio or Video say a sentence by cutting together the words said in it';
  descriptionLocalizations = I18n.localizations('commands.media_av.audio.sentence_mix.description');
  metadata = {
    id: Formatter.Commands.MediaAVManipulationAudioSentenceMix.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_av.audio.sentence_mix.name');

  constructor() {
    super({
      options: [
        {name: 'sentence', description: 'What to make it say, from the words said in it', ...I18n.optionLocalizations('commands.media_av.audio.sentence_mix.sentence'), required: true},
        {name: 'skip-missing', description: 'Leave out words that aren\'t said instead of failing (Default: False)', ...I18n.optionLocalizations('commands.media_av.audio.sentence_mix.skip_missing'), label: 'skipmissing', type: Boolean},
        {name: 'gap', description: 'Silence between the words in milliseconds, 0 to 1000 (Default: 0)', ...I18n.optionLocalizations('commands.media_av.audio.sentence_mix.gap'), type: Number},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationAudioSentenceMix.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationAudioSentenceMix.createMessage(context, args);
  }
}
