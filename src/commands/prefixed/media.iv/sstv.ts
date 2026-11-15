import { Command, CommandClient } from 'detritus-client';

import { CommandCategories, MediaSSTVModes, MediaSSTVModesToText } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export const COMMAND_NAME = 'sstv';

export default class SSTVCommand extends BaseImageCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'mode', aliases: ['m'], type: Parameters.oneOf({choices: MediaSSTVModes, descriptions: MediaSSTVModesToText}), metadata: {description: 'the slow-scan tv mode, Robot 36 is the shortest (default: Martin 1)'}},
      ],
      metadata: {
        category: CommandCategories.AUDIO,
        description: 'Turn an Image into a slow-scan TV (SSTV) signal that decoder apps turn back into the picture',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/photo.jpg`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/face.png -mode robot36`,
        ],
        id: Formatter.Commands.MediaIVToolsSSTV.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-mode <MediaSSTVModes>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVToolsSSTV.CommandArgs) {
    return Formatter.Commands.MediaIVToolsSSTV.createMessage(context, args);
  }
}
