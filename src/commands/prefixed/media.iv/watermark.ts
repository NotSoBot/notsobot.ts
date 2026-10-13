import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'watermark';

export default class WatermarkCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'margin', aliases: ['m'], type: Number},
        {name: 'opacity', aliases: ['o'], type: Number},
        {name: 'size', aliases: ['s'], type: Number},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Place the second media small in the bottom right corner of the first media',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} @cakedan @notsobot -size 30 -opacity 75 -margin 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayWatermark.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-margin <number 0..50>) (-opacity <number 0..100>) (-size <number 1..100>)',
      },
      maxAmount: 2,
      minAmount: 2,
      type: Parameters.mediaUrls({audio: false, maxAmount: 2, minAmount: 2}),
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayWatermark.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayWatermark.createMessage(context, args);
  }
}
