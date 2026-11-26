import { Interaction } from 'detritus-client';

import { MediaFaceFilters } from '../../../../constants';
import { Formatter, I18n, Parameters } from '../../../../utils';

import { BaseInteractionImageOrVideoCommandOption } from '../../basecommand';


const DEFAULT_FILTER = Formatter.Commands.MediaIVManipulationFaceFilter.DEFAULT_FILTER;

const MediaFaceFiltersNames = {DOG: 'Dog', DALMATIAN: 'Dalmatian', HEARTS: 'Heart Ears', PIG: 'Pig', FLOWERS: 'Flower Crown', WIG: 'Rainbow Wig'};

export const COMMAND_NAME = 'face-filter';

export class MediaIVFaceFilterCommand extends BaseInteractionImageOrVideoCommandOption {
  description = 'Put a Snapchat style filter on every face in an Image or Video';
  descriptionLocalizations = I18n.localizations('commands.media_iv_face_2.face_filter.description');
  metadata = {
    id: Formatter.Commands.MediaIVManipulationFaceFilter.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.media_iv_face_2.face_filter.name');

  constructor() {
    super({
      options: [
        {
          name: 'filter',
          description: 'Which filter (Default: Dog)',
          ...I18n.optionLocalizations('commands.media_iv_face_2.face_filter.filter'),
          choices: Parameters.Slash.oneOf({
            choices: MediaFaceFilters,
            defaultChoice: DEFAULT_FILTER,
            descriptions: MediaFaceFiltersNames,
            localizationKey: 'choices.face_filters',
          }),
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.MediaIVManipulationFaceFilter.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceFilter.createMessage(context, args);
  }
}
