import { Command, CommandClient } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Markup } from 'detritus-client/lib/utils';

import { deleteTag } from '../../../api';
import { RestResponsesRaw } from '../../../api/types';
import { CommandTypes, DateMomentLogFormat, EmbedColors } from '../../../constants';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, createUserString, editOrReply, fetchMemberOrUserById } from '../../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {
  force: boolean,
  tag: false | null | RestResponsesRaw.Tag,
}

export interface CommandArgs {
  force: boolean,
  tag: RestResponsesRaw.Tag,
}

export const COMMAND_NAME = 'tag remove';

export default class TagRemoveCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      aliases: ['t remove'],
      args: [
        {name: 'force', type: Boolean},
      ],
      label: 'tag',
      metadata: {
        description: 'Delete a tag',
        examples: [
          `${COMMAND_NAME} something`,
          `${COMMAND_NAME} some tag`,
          `${COMMAND_NAME} some tag -force`,
        ],
        type: CommandTypes.FUN,
        usage: '<tagname> (-force)',
      },
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
    if (tag.user.id !== context.userId) {
      if (args.force) {
        if (!context.user.isClientOwner && !(context.member && context.member.canManageGuild)) {
          return editOrReply(context, '⚠ Not enough permissions to force delete a tag!');
        }
      } else {
        return editOrReply(context, '⚠ You\'re not the owner of this tag!');
      }
    }
    await deleteTag(context, {name: tag.name, serverId: context.guildId || context.channelId});
    return editOrReply(context, `Removed tag ${tag.name}`);
  }
}
