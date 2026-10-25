import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaBounceAxes, MediaBounceStyles } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'bounce';

export default class BounceCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'axis', aliases: ['a'], type: Parameters.oneOf({choices: MediaBounceAxes})},
        {name: 'bounces', aliases: ['b'], type: 'float', metadata: {description: '0.1 to 10, per second'}},
        {name: 'duration', aliases: ['d'], type: 'float', metadata: {description: '0.5 to 30 seconds, for still images'}},
        {name: 'minimum', aliases: ['m', 'min'], type: 'float', metadata: {description: '1 to 100, percent of the original'}},
        {name: 'style', aliases: ['s'], type: Parameters.oneOf({choices: MediaBounceStyles})},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make an Image or Video Bounce, every frame its own size',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
          `${COMMAND_NAME} notsobot -axis width -style wave`,
          `${COMMAND_NAME} notsobot -bounces 4 -minimum 20`,
        ],
        id: Formatter.Commands.MediaIVManipulationBounce.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-axis <choice>) (-bounces <float>) (-duration <float>) (-minimum <float>) (-style <choice>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationBounce.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationBounce.createMessage(context, args);
  }
}
