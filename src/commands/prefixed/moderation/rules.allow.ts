import { CommandClient } from 'detritus-client';

import { RulesAddBaseCommand } from './rules.add.base';


export const COMMAND_NAME = 'rules allow';

export default class RulesAllowCommand extends RulesAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['rules add allow'],
      allow: true,
      description: 'Allow everything, a category, or a command for Channels/Roles/Users or Server-Wide, over less specific rules',
      name: COMMAND_NAME,
    });
  }
}
