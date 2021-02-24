import { Command, CommandClient } from 'detritus-client';
import { Markup } from 'detritus-client/lib/utils';

import { fetchTag, putTag } from '../../api';
import { CommandTypes } from '../../constants';
import { editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  content: string,
  tag: string,
}

export interface CommandArgs {
  content: string,
  tag: string,
}

export const COMMAND_NAME = 'tag create';

export default class TagCreateCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t create'],
      metadata: {
        description: 'Create a tag',
        examples: [
          `${COMMAND_NAME} test im a tag`,
          `${COMMAND_NAME} "test tag" im a test tag!`,
        ],
        type: CommandTypes.FUN,
        usage: '<tagname> <...body>',
      },
      type: [
        {name: 'tag'},
        {name: 'content', consume: true},
      ],
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.tag && !!args.content;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.tag || args.content) {
      if (!args.tag) {
        return editOrReply(context, '⚠ Gotta have some sort of tag name');
      }
      if (!args.content) {
        return editOrReply(context, '⚠ Must have some sort of content for the tag!');
      }
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guildId = context.guildId || undefined;
    if (!guildId) {
      return editOrReply(context, '⚠ Global tags are a no-no right now');
    }

    let isEdit = false;
    try {
      const tag = await fetchTag(context, {guildId, name: args.tag});
      if (tag.user.id !== context.userId && !tag.global) {
        return editOrReply(context, '⚠ Tag already exists in this server!');
      }
      isEdit = true;
    } catch(error) {

    }

    const tag = await putTag(context, {content: args.content, guildId, name: args.tag});

    let text: string;
    if (isEdit) {
      text = `Successfully edited tag ${Markup.codestring(tag.name)}`;
    } else {
      text = `Successfully created tag ${Markup.codestring(tag.name)}`;
    }
    return editOrReply(context, text);
  }
}
