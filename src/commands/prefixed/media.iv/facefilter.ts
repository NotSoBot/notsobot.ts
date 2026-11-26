import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaFaceFilters } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'facefilter';

export default class FaceFilterCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['face filter', 'snapfilter'],
      args: [
        {name: 'filter', aliases: ['f'], type: Parameters.oneOf({choices: MediaFaceFilters})},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Put a Snapchat style filter (dog, dalmatian, hearts, pig, flowers, wig) on every face in an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -filter pig`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceFilter.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-filter <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceFilter.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceFilter.createMessage(context, args);
  }
}
