import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseImageOrVideoCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay papuanewguinea';

export default class OverlayPapuaNewGuineaCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['o papuanewguinea', 'overlay papua', 'o papua', 'papuanewguinea', 'papua'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Overlay a Papua New Guinean flag over an Image or Video',
        examples: [
          COMMAND_NAME,
          `${COMMAND_NAME} notsobot`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayFlagPapuaNewGuinea.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url>',
      },
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayFlagPapuaNewGuinea.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayFlagPapuaNewGuinea.createMessage(context, args);
  }
}
