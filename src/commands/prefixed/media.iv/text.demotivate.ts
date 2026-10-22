import { Command, CommandClient } from 'detritus-client';

import { CommandCategories } from '../../../constants';
import { Formatter, Parameters } from '../../../utils';

import { BaseCommand, BaseImageOrVideoCommand } from '../basecommand';


export interface CommandArgsBefore {
  text: string,
  url?: null | string,
}

export const COMMAND_NAME = 'text demotivate';

export default class TextDemotivateCommand extends BaseImageOrVideoCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['text demotivational'],
      metadata: {
        category: CommandCategories.EFFECTS,
        description: 'Turn an Image or Video into a demotivational poster',
        examples: [
          `${COMMAND_NAME} Teamwork`,
          `${COMMAND_NAME} @NotSoBot Teamwork | none of us is as dumb as all of us`,
        ],
        id: Formatter.Commands.MediaIVManipulationDemotivate.COMMAND_ID,
        usage: '?<emoji,user:id|mention,url> <...title> ?| <...text>',
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

  run(context: Command.Context, args: Formatter.Commands.MediaIVManipulationDemotivate.CommandArgs) {
    // `title | text`, the text is optional
    const [ before, ...after ] = (args.text || '').split('|');
    args.title = before.trim();
    if (after.length) {
      args.text = after.join('|').trim();
    }
    return Formatter.Commands.MediaIVManipulationDemotivate.createMessage(context, args);
  }
}
