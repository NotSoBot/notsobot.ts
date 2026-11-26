import { Interaction } from 'detritus-client';

import { MediaSpeechBubbleDirections } from '../../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../../basecommand';


const DEFAULT_DIRECTION = Formatter.Commands.MediaIVManipulationOverlaySpeechBubble.DEFAULT_DIRECTION;

const MediaSpeechBubbleDirectionsNames = {AUTO: 'Auto (beside the face)', LEFT: 'Left', CENTER: 'Center (down onto the head)', RIGHT: 'Right'};

export const COMMAND_NAME = 'speech-bubble';

export class MediaIVMemeSpeechBubbleCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Cut a speech bubble out of the top of an Image or Video, its tail pointing at the face';
  descriptionLocalizations = I18n.localizations('commands.media_iv.overlay.speech_bubble.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationOverlaySpeechBubble.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv.overlay.speech_bubble.name');

  constructor() {
    super({
      options: [
        {
          name: 'direction',
          description: 'Where the tail points (Default: Auto)',
          ...I18n.optionLocalizations('commands.media_iv.overlay.speech_bubble.direction'),
          choices: Parameters.Slash.oneOf({
            choices: MediaSpeechBubbleDirections,
            defaultChoice: DEFAULT_DIRECTION,
            descriptions: MediaSpeechBubbleDirectionsNames,
            localizationKey: 'choices.speech_bubble_directions',
          }),
        },
        {
          name: 'white',
          description: 'A white bubble instead of a cut out one (videos are always white)',
          ...I18n.optionLocalizations('commands.media_iv.overlay.speech_bubble.white'),
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationOverlaySpeechBubble.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlaySpeechBubble.createMessage(context, args);
  }
}
