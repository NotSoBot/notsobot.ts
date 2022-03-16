import { Interaction } from 'detritus-client';
import { MessageFlags } from 'detritus-client/lib/constants';

import { GoogleLocales } from '../../../../../constants';
import { Formatter, Parameters, editOrReply } from '../../../../../utils';

import { BaseInteractionCommandOption } from '../../../basecommand';


export interface CommandArgs {
  opt: boolean,
}

export class SettingsUserOptOutContentCommand extends BaseInteractionCommandOption {
  description = 'Opt-Out of Message Content Scanning (No longer respond to non-slash commands nor view your media)';
  name = 'content';

  constructor() {
    super({
      options: [
        {
          name: 'opt-out',
          description: 'Opt Out',
          label: 'opt',
          required: true,
          type: Boolean,
        },
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return editOrReply(context, {
      content: '⚠ wip',
      flags: MessageFlags.EPHEMERAL,
    });
  }
}
