import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTag, putTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { BooleanEmojis, CommandCategories } from '../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  content: string,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  content: string,
  tag: RestResponsesRaw.Tag,
}

export const COMMAND_NAME = 'tag edit';

export default class TagEditCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t edit'],
      metadata: {
        category: CommandCategories.FUN,
        description: 'Edit a tag',
        examples: [
          `${COMMAND_NAME} test im a tag`,
          `${COMMAND_NAME} "test tag" im a test tag!`,
        ],
        id: Formatter.Commands.TagEdit.COMMAND_ID,
        usage: '<tagname> <...body>',
      },
      type: [
        {name: 'tag', default: null, type: Parameters.NotSoTag},
        {name: 'content', type: Parameters.tagContent, consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.tag && args.tag.user.id !== context.userId) {
      return false;
    }
    return !!args.tag && !!args.content;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.tag !== null || args.content) {
      if (args.tag === false) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Unknown Tag`);
      }
      if (!args.content) {
        return editOrReply(context, `${BooleanEmojis.WARNING} Must have some sort of content for the tag!`);
      }
      if (args.tag && args.tag.user.id !== context.userId) {
        return editOrReply(context, `${BooleanEmojis.WARNING} You don\'t own that tag!`);
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const tag = await putTag(context, {
      content: args.content,
      name: args.tag.name,
      serverId: context.guildId || context.channelId,
    });
    return editOrReply(context, `Successfully edited tag ${Markup.codestring(tag.name)}`);
  }
}
