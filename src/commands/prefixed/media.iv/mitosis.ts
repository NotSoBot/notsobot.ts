import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaMitosisDirections, MediaMitosisStyles } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'mitosis';

export default class MitosisCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'direction', aliases: ['dir'], type: Parameters.oneOf({choices: MediaMitosisDirections})},
        {name: 'duration', aliases: ['d'], type: 'float', metadata: {description: '0.5 to 30 seconds the split takes'}},
        {name: 'style', aliases: ['s'], type: Parameters.oneOf({choices: MediaMitosisStyles})},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make an Image or Video Stretch and Split in Two, run it again the other way for four',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -direction vertical`,
          `${COMMAND_NAME} notsobot -style absorb`,
        ],
        id: Formatter.Commands.MediaIVManipulationMitosis.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-direction <choice>) (-duration <float>) (-style <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationMitosis.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationMitosis.createMessage(context, args);
  }
}
