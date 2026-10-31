import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter } from '../../../utils';

import { BaseMediasCommand } from '../basecommand';


export const COMMAND_NAME = 'fadeoverlay';

export default class FadeOverlayCommand extends BaseMediasCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['overlayfade'],
      args: [
        {name: 'duration', aliases: ['d'], type: 'float', metadata: {description: 'seconds, 0 to 120 (default: until the end)'}},
        {name: 'noloop', aliases: ['nl'], type: Boolean},
        {name: 'resize', aliases: ['r'], metadata: {description: 'default: cover'}},
        {name: 'start', aliases: ['s'], type: 'float', metadata: {description: 'seconds, 0 to 120'}},
      ],
      metadata: {
        category: CommandCategories.CONVERSION,
        description: 'Slowly fade a media in on top of another, until it covers it',
        examples: [
          `${COMMAND_NAME} @cakedan @notsobot`,
          `${COMMAND_NAME} https://cdn.nsb.gg/assets/samples/video.mp4 @notsobot -start 2 -duration 3`,
        ],
        id: Formatter.Commands.MediaAIVManipulationFadeOverlay.COMMAND_ID,
        usage: '?<emoji,user:id|mention|name,url> ?<emoji,user:id|mention|name,url> (-duration <float>) (-noloop) (-resize <expression>) (-start <float>)',
      },
      minAmount: 2,
      priority: -1,
    });
  }

  async run(context: Command.Context, args: Formatter.Commands.MediaAIVManipulationFadeOverlay.CommandArgs) {
    return Formatter.Commands.MediaAIVManipulationFadeOverlay.createMessage(context, args);
  }
}
