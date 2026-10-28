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
        {name: 'scale', aliases: ['s'], type: Number, metadata: {description: '1 to 100'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Make an Audio/Image/Video look and sound like it was sent from an old Android phone',
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
