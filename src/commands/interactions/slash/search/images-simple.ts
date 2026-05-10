import { Interaction } from 'detritus-client';

import { DefaultParameters, Formatter, Parameters } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export class SearchImagesSimpleCommand extends BaseInteractionCommandOption {
  description = 'Search Images from Bing, DuckDuckGo, or Google but with less data displayed';
  metadata = {
    id: Formatter.Commands.SearchImages.COMMAND_ID_SIMPLE,
  };
  name = 'images-simple';

  constructor() {
    super({
      options: [
        {
          name: 'query',
          description: 'Search Text',
          required: true,
        },
        {
          name: 'randomize',
          description: 'Randomize the Image Results',
          type: Boolean,
        },
        {
          name: 'safe',
          description: 'Safe Search',
          type: Boolean,
          default: DefaultParameters.safe,
          value: Parameters.Slash.safe,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.SearchImages.CommandArgs) {
    return Formatter.Commands.SearchImages.createMessage(context, {
      ...args,
      simple: true,
    });
  }
}
