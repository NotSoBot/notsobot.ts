import { Command, CommandClient, Structures } from 'detritus-client';
import { Permissions } from 'detritus-client/lib/constants';
import { Embed, Markup } from 'detritus-client/lib/utils';

import { CommandTypes, DateMomentLogFormat, EmbedColors } from '../../constants';
import ServerExecutionsStore, { ServerExecutionsStored } from '../../stores/serverexecutions';
import { Parameters, createTimestampMomentFromGuild, createUserEmbed, editOrReply } from '../../utils';

import { BaseCommand } from '../basecommand';


export interface CommandArgsBefore {

}

export interface CommandArgs {

}

export const COMMAND_NAME = 'nick mass cancel';

export default class NickMassCancelCommand extends BaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      name: COMMAND_NAME,

      disableDm: true,
      label: 'text',
      metadata: {
        description: 'Cancel an ongoing mass nickname change',
        examples: [
          COMMAND_NAME,
        ],
        type: CommandTypes.MODERATION,
        usage: '',
      },
      permissionsClient: [Permissions.CHANGE_NICKNAMES],
      permissions: [Permissions.CHANGE_NICKNAMES, Permissions.MANAGE_GUILD],
      priority: -1,
    });
  }

  async run(context: Command.Context, args: CommandArgs) {
    const guild = context.guild as Structures.Guild;

    const isExecuting = ServerExecutionsStore.getOrCreate(guild.id);
    if (isExecuting.nick) {
      isExecuting.nick = false;
      return context.editOrReply('Canceled mass nickname changes');
    } else {
      return context.editOrReply('Mass nickname isn\'t ongoing right now');
    }
  }
}
