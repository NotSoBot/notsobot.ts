import { CommandClient } from 'detritus-client';

import { RulesAddBaseCommand } from './rules.add.base';


export const COMMAND_NAME = 'rules block';

export default class RulesBlockCommand extends RulesAddBaseCommand {
  constructor(client: CommandClient) {
    super(client, {
      aliases: ['rules add block'],
      allow: false,
      description: 'Block everything, a category, or a command for Channels/Roles/Users or Server-Wide',
      name: COMMAND_NAME,
    });
  }
}
