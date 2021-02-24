import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTag, putTag } from '../../api';
import { RestResponsesRaw } from '../../api/types';
import { CommandTypes } from '../../constants';
import { Parameters, editOrReply } from '../../utils';

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
        description: 'Edit a tag',
        examples: [
          `${COMMAND_NAME} test im a tag`,
          `${COMMAND_NAME} "test tag" im a test tag!`,
        ],
        type: CommandTypes.FUN,
        usage: '<tagname> <...body>',
      },
      type: [
        {name: 'tag', default: null, type: Parameters.NotSoTag},
        {name: 'content', consume: true},
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
        return editOrReply(context, '⚠ Unknown Tag');
      }
      if (!args.content) {
        return editOrReply(context, '⚠ Must have some sort of content for the tag!');
      }
      if (args.tag && args.tag.user.id !== context.userId) {
        return editOrReply(context, '⚠ You don\'t own that tag!');
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const tag = await putTag(context, {
      content: args.content,
      guildId: context.guildId || undefined,
      name: args.tag.name,
    });
    return editOrReply(context, `Successfully edited tag ${Markup.codestring(tag.name)}`);
  }
}
