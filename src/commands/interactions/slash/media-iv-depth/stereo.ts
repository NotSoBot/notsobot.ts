import { Interaction } from 'detritus-client';

import { MediaStereoTypes } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';
import { FOCUS_OPTIONS } from './options';


const MediaStereoTypesNames = {ANAGLYPH: 'Anaglyph (Red/Cyan)', CROSSEYE: 'Cross-Eye', MAGICEYE: 'Magic Eye', SIDEBYSIDE: 'Side By Side', WIGGLE: 'Wigglegram'};


export const COMMAND_NAME = 'stereo';

export class MediaIVDepthStereoCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Make it stereo 3D: red/cyan anaglyph, side by side, cross-eye, wigglegram or magic eye';
  descriptionLocalizations = I18n.localizations('commands.media_iv_depth.stereo.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationDepthStereo.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_depth.stereo.name');

  constructor() {
    super({
      options: [
        {
          name: 'type',
          description: 'What kind of 3D (Default: Anaglyph)',
          ...I18n.optionLocalizations('commands.media_iv_depth.stereo.type'),
          choices: Parameters.Slash.oneOf({
            choices: MediaStereoTypes,
            defaultChoice: MediaStereoTypes.ANAGLYPH,
            descriptions: MediaStereoTypesNames,
            localizationKey: 'choices.stereo_types',
          }),
        },
        {
          name: 'amount',
          description: 'How strong the 3D is, a percent of the width, 0.5 to 10 (Default: 3)',
          ...I18n.optionLocalizations('commands.media_iv_depth.stereo.amount'),
          maxValue: 10,
          minValue: 0.5,
          type: 'number',
        },
        ...FOCUS_OPTIONS,
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationDepthStereo.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationDepthStereo.createMessage(context, args);
  }
}
