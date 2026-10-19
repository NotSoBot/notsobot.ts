import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceFeaturesSwapModes, MediaFaceFeaturesSwapRegions } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'mimic';

export default class MimicCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'mode', aliases: ['m'], type: Parameters.oneOf({choices: MediaFaceFeaturesSwapModes}), metadata: {description: 'relative adds the motion to the face\'s own, absolute copies it as is'}},
        {name: 'multiplier', aliases: ['x'], type: 'float', metadata: {description: '0 to 2, how much of the motion'}},
        {name: 'regions', aliases: ['r'], type: Parameters.oneOf({choices: MediaFaceFeaturesSwapRegions}), metadata: {description: 'what gets copied'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make the first media\'s face copy the expression and head pose of the second media\'s face, follows along with a gif or video',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} @cakedan https://example.com/talking.mp4 -regions LIPS`,
          `${COMMAND_NAME} @cakedan @notsobot -regions EXPRESSION -multiplier 1.5`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceFeaturesSwap.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-mode <MediaFaceFeaturesSwapModes>) (-multiplier <float>) (-regions <MediaFaceFeaturesSwapRegions>)',
      },
      minAmount: 2,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceFeaturesSwap.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceFeaturesSwap.createMessage(context, args);
  }
}
