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
        {name: 'blend', aliases: ['b'], type: 'float', metadata: {description: '0 to 1'}},
        {name: 'color', aliases: ['c']},
        {name: 'noloop', aliases: ['nl'], type: Boolean},
        {name: 'opacity', aliases: ['o'], type: Number, metadata: {description: '0 to 100'}},
        {name: 'resize', aliases: ['r']},
        {name: 'similarity', aliases: ['s'], type: 'float', metadata: {description: '0.01 to 1'}},
        {name: 'x'},
        {name: 'y'},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Overlay one media on top of another',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} @cakedan @notsobot -resize fit(mw, mh) -x (mw/2)-(ow/2) -y (mh/2)-(oh/2)`,
        ],
        id: Formatter.Commands.MediaAIVManipulationOverlay.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-blend <float>) (-color <string:FFMPEGColors|HEX|RGBA?>) (-noloop) (-opacity <number>) (-resize <expression>) (-similarity <float>) (-x <expression>) (-y <expression>)',
      },
      minAmount: 2,
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationOverlay.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationOverlay.createMessage(context, args);
  }
}
