import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export const COMMAND_NAME = 'text notification';

export default class TextNotificationCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['text notif'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Add an iPhone notification banner to the top of an Image or Video',
        examples: [
          `${COMMAND_NAME} u up?`,
          `${COMMAND_NAME} @NotSoBot Mom | call me right now`,
        ],
        id: Formatter.Commands.MediaIVManipulationOverlayNotification.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> ?<...title> | <...message>',
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

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationOverlayNotification.CommandArgs) {
    // `title | text`, or just the text
    const [ before, ...after ] = (args.text || '').split('|');
    if (after.length) {
      args.title = before.trim();
      args.text = after.join('|').trim();
    }
    return Formatter.Commands.MediaIVManipulationOverlayNotification.createMessage(context, args);
  }
}
