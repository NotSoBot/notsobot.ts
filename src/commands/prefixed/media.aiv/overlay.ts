import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'overlay';

export default class OverlayCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'blend', type: 'float'},
        {name: 'color', aliases: ['c']},
        {name: 'noloop', type: Boolean},
        {name: 'opacity', type: Number},
        {name: 'resize'},
        {name: 'similarity', aliases: ['s'], type: 'float'},
        {name: 'x'},
        {name: 'y'},
      ],
      metadata: {
        category: CommandCategories.TOOLS,
        description: 'Overlay one media on top of another',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} @cakedan @notsobot -resize fit(mw, mh) -x (mw/2)-(ow/2) -y (mh/2)-(oh/2)`,
        ],
        id: Formatter.Commands.MediaAIVToolsOverlay.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-blend <float>) (-color <string:FFMPEGColors|HEX|RGBA?>) (-noloop) (-opacity <number>) (-resize <expression>) (-similarity <float>) (-x <expression>) (-y <expression>)',
      },
      minAmount: 2,
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVToolsOverlay.CommandArgs) {
    return Formatter.Commands.MediaAIVToolsOverlay.createMessage(context, args);
  }
}
