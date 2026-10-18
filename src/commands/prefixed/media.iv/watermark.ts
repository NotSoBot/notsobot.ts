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
        {name: 'margin', aliases: ['m'], type: Number, metadata: {description: '0 to 50'}},
        {name: 'opacity', aliases: ['o'], type: Number, metadata: {description: '0 to 100'}},
        {name: 'size', aliases: ['s'], type: Number, metadata: {description: '1 to 100'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Place the second media small in the bottom right corner of the first media',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} @cakedan @notsobot -size 30 -opacity 75 -margin 5`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayWatermark.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-margin <number>) (-opacity <number>) (-size <number>)',
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
