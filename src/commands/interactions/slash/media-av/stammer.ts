import { Interaction } from 'detritus-client';

import {
  MediaStammerColorModes,
  MediaStammerColorModesToText,
  MediaStammerMatcherModes,
  MediaStammerMatcherModesToText,
} from '../../../../constants';
import { Formatter, Parameters } from '../../../../utils';

import { BaseInteractionMediasCommandOption } from '../../basecommand';


const DEFAULT_COLOR_MODE = Formatter.Commands.MediaAVManipulationStammer.DEFAULT_COLOR_MODE;
const DEFAULT_MATCHER_MODE = Formatter.Commands.MediaAVManipulationStammer.DEFAULT_MATCHER_MODE;

export const COMMAND_NAME = 'stammer';

export class MediaAVStammerCommand extends BaseInteractionMediasCommandOption {
  description = 'Cut up the audio and video frames of a media to match with the modulator\'s audio frames';
  metadata = {
    id: Formatter.Commands.MediaAVManipulationStammer.COMMAND_ID,
  };
  name = COMMAND_NAME;

  constructor() {
    super({
      options: [
        {
          name: 'color-mode',
          description: `Color Mode (Default: ${DEFAULT_COLOR_MODE})`,
          label: 'colorMode',
          choices: Parameters.Slash.oneOf({
            choices: MediaStammerColorModes,
            descriptions: MediaStammerColorModesToText,
            defaultChoice: DEFAULT_COLOR_MODE,
          }),
        },
        {
          name: 'matcher-mode',
          description: `Matcher Mode (Default: ${DEFAULT_MATCHER_MODE})`,
          label: 'matcherMode',
          choices: Parameters.Slash.oneOf({
            choices: MediaStammerMatcherModes,
            descriptions: MediaStammerMatcherModesToText,
            defaultChoice: DEFAULT_MATCHER_MODE,
          }),
        },
      ],
      minAmount: 2,
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaAVManipulationStammer.CommandArgs) {
    return Formatter.Commands.MediaAVManipulationStammer.createMessage(context, args);
  }
}
