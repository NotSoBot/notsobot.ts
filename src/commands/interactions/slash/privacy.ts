import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { editOrReply } from '../../../utils';

import { BaseSlashCommand } from '../basecommand';


export const COMMAND_NAME = 'privacy';

export default class PrivacyCommand extends BaseSlashCommand {
  description = 'Privacy Policy';
  name = COMMAND_NAME;

  run(context: Interaction.InteractionContext) {
    return editOrReply(context, {
      content: '<https://beta.notsobot.com/legal/privacy>',
      flags: MessageFlags.EPHEMERAL,
    });
  }
}
