import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'eyes cutout';

export default class EyesCutoutCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: 'cutout',
      prefixes: ['eyes ', 'eye '],

      args: [
        {name: 'color', aliases: ['c'], metadata: {description: 'color covering the face behind them, when there\'s no second media'}},
        {name: 'face', type: Parameters.number({max: 99, min: 0}), metadata: {description: 'the number drawfaces shows, the biggest face by default'}},
        {name: 'size', aliases: ['s'], type: Parameters.number({max: 3, min: 1}), metadata: {description: '1 to 3, how much bigger they get (1.8 by default)'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Cut out people\'s eyes and mouth and paste them back bigger, over a second media (a still of it) or a color covering the face',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png @notsobot`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 -color #3399ff -size 2.2`,
        ],
        id: Formatter.Commands.MediaIVManipulationFaceCutout.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-color <color>) (-face <number>) (-size <number>)',
      },
      maxAmount: 2,
      minAmount: 1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationFaceCutout.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationFaceCutout.createMessage(context, args);
  }
}
