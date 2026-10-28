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
        {name: 'amount', aliases: ['a'], type: Number, metadata: {description: '1 to 100'}},
        {name: 'degrees', aliases: ['d'], type: Number, metadata: {description: '-360 to 360'}},
        {name: 'fly', label: 'flyImage', type: Parameters.mediaUrl({audio: false, video: false, onlyContent: true})},
        {name: 'speed', aliases: ['s'], type: 'float', metadata: {description: '0.01 to 1000'}},
      ],
      metadata: {
        description: 'Overlay some flies on an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        category: CommandCategories.EFFECTS,
        id: Formatter.Commands.MediaIVManipulationOverlayFlies.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-amount <number>) (-degrees <number>) (-fly <emoji,user:id|mention|name,url>) (-speed <float>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlies.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlies.createMessage(context, args);
  }
}
