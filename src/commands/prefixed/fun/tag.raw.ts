import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { RestResponsesRaw } from '../../../api/types';
import { CommandTypes, DateMomentLogFormat, EmbedColors } from '../../../constants';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, createUserString, editOrReply, fetchMemberOrUserById } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  tag: RestResponsesRaw.Tag,
}

export const COMMAND_NAME = 'tag raw';

export default class TagCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t raw', 'tag owner', 't owner'],
      label: 'tag',
      metadata: {
        description: 'View a tag\'s raw content',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} some tag`,
        ],
        type: CommandTypes.FUN,
        usage: '<tagname>',
      },
      permissionsClient: [Permissions.EMBED_LINKS],
      type: Parameters.NotSoTag,
    });
  }

  onBeforeRun(context: Command.Context, args: CommandArgsBefore) {
    return !!args.tag;
  }

  onCancelRun(context: Command.Context, args: CommandArgsBefore) {
    if (args.tag === false) {
      return editOrReply(context, '⚠ Unknown Tag');
    }
    return super.onCancelRun(context, args);
  }

  async run(context: Command.Context, args: CommandArgs) {
    const { tag } = args;

    const embed = createUserEmbed(context.user);
    embed.setColor(EmbedColors.DEFAULT);
    embed.setTitle(tag.name);

    embed.setDescription(Markup.codeblock(tag.content));

    {
      const description: Array<string> = [];

      {
        const timestamp = createTimestampMomentFromGuild(tag.created, context.guildId);
        description.push(`**Created**: ${timestamp.fromNow()}`);
        description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
      }
      if (tag.edited) {
        const timestamp = createTimestampMomentFromGuild(tag.edited, context.guildId);
        description.push(`**Edited**: ${timestamp.fromNow()}`);
        description.push(`**->** ${Markup.spoiler(timestamp.format(DateMomentLogFormat))}`);
      }

      // look through cache, else use the tag object
      description.push(`**Global**: ${(tag.global) ? 'Yes' : 'No'}`);
      description.push(`**NSFW**: ${(tag.nsfw) ? 'Yes' : 'No'}`);

      {
        const owner = await fetchMemberOrUserById(context, tag.user.id);
        description.push(`**Owner**: ${createUserString(tag.user.id, owner, 'Deleted User?')}`);
      }

      description.push(`**Uses**: ${tag.uses.toLocaleString()}`);

      embed.addField('Information', description.join('\n'));
    }

    return editOrReply(context, {embed});
  }
}
