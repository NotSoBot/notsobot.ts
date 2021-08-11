import { Command, CommandClient } from 'detritus-client';

import { imageOverlayFlagIsrael } from '../../../api';
import { CommandTypes } from '../../../constants';
import { imageReply } from '../../../utils';

import { BaseImageCommand } from '../basecommand';


export interface CommandArgsBefore {
  url?: null | string,
}

export interface CommandArgs {
  url: string,
}

export const COMMAND_NAME = 'overlay irsael';

export default class OverlayIsraelCommand extends BaseImageCommand<CommandArgs> {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o israel', 'overlay hebrew', 'o hebrew', 'overlay jewish', 'o jewish', 'israel', 'hebrew', 'jewish'],
      metadata: {
        description: 'Overlay an Israeli flag over an image',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        type: CommandTypes.IMAGE,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const response = await imageOverlayFlagIsrael(context, args);
    return imageReply(context, response);
  }
}
