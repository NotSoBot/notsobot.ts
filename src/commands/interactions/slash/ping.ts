import { Interaction } from 'detritus-client';
import { ApplicationIntegrationTypes, InteractionContextTypes } from 'detritus-client/lib/constants';

import { editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'ping';

export default class PingCommand extends BaseSlashCommand {
  description = 'Ping';
  name = COMMAND_NAME;

  contexts = [
    InteractionContextTypes.GUILD,
    InteractionContextTypes.BOT_DM,
    InteractionContextTypes.PRIVATE_CHANNEL,
  ];
  integrationTypes = [
    ApplicationIntegrationTypes.GUILD_INSTALL,
    ApplicationIntegrationTypes.USER_INSTALL,
  ];

  async run(context: Interaction.InteractionContext) {
    const { gateway, rest } = await context.client.ping();
    return editOrReply(context, `pong! (gateway: ${gateway}ms) (rest: ${rest}ms)`);
  }
}
