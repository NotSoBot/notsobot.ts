import { Interaction } from 'detritus-client';

import { I18n } from '../../../../../utils';

import { createNickMassResetMessage } from '../../../../prefixed/moderation/nick.mass.reset';

import { BaseNickMassCommandOption, CommandArgs, nickMassFilterOptions } from './base';


export const COMMAND_NAME = 'reset';

export class ModerationNickMassResetCommand extends BaseNickMassCommandOption {
  description = 'Reset the nickname of multiple members';
  descriptionLocalizations = I18n.localizations('commands.moderation.nick_mass.reset.description');
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.nick_mass.reset.name');

  constructor() {
    super({
      options: [...nickMassFilterOptions('commands.moderation.nick_mass.reset')],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return createNickMassResetMessage(context, {nobots: !!args.nobots, nousers: !!args.nousers, role: args.role, text: ''});
  }
}
