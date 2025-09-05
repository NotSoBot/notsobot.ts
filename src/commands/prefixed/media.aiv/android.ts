import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediaCommand } from '../basecommand';


export const COMMAND_NAME = 'android';

export default class AndroidCommand extends BaseMediaCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'scale', aliases: ['s'], type: Number},
      ],
      metadata: {
        category: CommandCategories.IMAGE,
        description: 'Compress the Audio/Image/Video File to be Android-Like',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaAIVManipulationAndroid.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> (-scale <number>)',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationAndroid.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationAndroid.createMessage(context, args);
  }
}
