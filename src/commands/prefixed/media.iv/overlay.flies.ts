import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay flies';

export default class OverlayFliesCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o flies', 'flies'],
      args: [
        {name: 'amount', aliases: ['a'], type: Number},
        {name: 'degrees', aliases: ['d'], type: Number},
        {name: 'fly', label: 'flyImage', type: Parameters.mediaUrl({audio: false, video: false, onlyContent: true})},
        {name: 'speed', aliases: ['s'], type: 'float'},
      ],
      metadata: {
        description: 'Overlay some flies over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.IMAGE,
        id: Formatter.Commands.MediaIVManipulationOverlayFlies.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>) (-degrees <number>) (-fly <emoji,user:id|mention|name,url>) (-speed <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlies.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlies.createMessage(context, args);
  }
}
