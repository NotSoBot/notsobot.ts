import { Interaction } from 'detritus-client';

import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


export const COMMAND_NAME = 'grain';

export class MediaIVGrainCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Apply a Film Grain effect to an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_2.fun.grain.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationGrain.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_2.fun.grain.name');
  
  constructor() {
    super({
      options: [
        {name: 'strength', description: 'Film Grain Strength (0..100) (Default: 20)', ...I18n.optionLocalizations('commands.media_iv_2.fun.grain.strength'), type: Number},
        {name: 'flags', description: 'FFMPEG Noise Flags (choices: aptu) (Default: at)', ...I18n.optionLocalizations('commands.media_iv_2.fun.grain.flags')},
      ],
    });
  }
  
  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationGrain.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationGrain.createMessage(context, args);
  }
}
