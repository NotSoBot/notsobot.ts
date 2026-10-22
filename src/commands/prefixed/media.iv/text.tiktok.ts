import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export const COMMAND_NAME = 'text tiktok';

export default class TextTikTokCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      args: [
        {name: 'dark', aliases: ['d'], type: Boolean, metadata: {description: 'black boxes with white text'}},
        {name: 'position', aliases: ['p'], type: 'float', metadata: {description: '0 (top) to 100 (bottom), default 50'}},
      ],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Add TikTok text (every line in a rounded box) to an Image or Video',
        examples: [
          `${COMMAND_NAME} pov: you forgot your charger`,
          `${COMMAND_NAME} @NotSoBot me explaining -position 30 -dark`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayTikTok.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...text> (-dark) (-position <float>)',
      },
      type: [
        {name: 'url', type: Parameters.mediaUrlPositional({audio: false})},
        {name: 'text', type: Parameters.parsedMentionsText, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.text && super.onBeforeRun(context, args);
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (!args.text) {
      return BaseCommand.prototype.onCancelRun.call(this, context, args);
    }
    return super.onCancelRun(context, args);
  }

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayTikTok.CommandArgs) {
    return Formatter.Commands.MediaIVManipulationOverlayTikTok.createMessage(context, args);
  }
}
