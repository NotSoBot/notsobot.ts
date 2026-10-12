import { Interaction } from 'detritus-client';

import { I18n } from '../../../../../utils';

import { createNickMassMessage } from '../../../../prefixed/moderation/nick.mass';

import { BaseNickMassCommandOption, CommandArgs as BaseCommandArgs, nickMassFilterOptions } from './base';


export interface CommandArgs extends BaseCommandArgs {
  nickname: string,
}

export const COMMAND_NAME = 'set';

export class ModerationNickMassSetCommand extends BaseNickMassCommandOption {
  description = 'Change the nickname of multiple members';
  descriptionLocalizations = I18n.localizations('commands.moderation.nick_mass.set.description');
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.nick_mass.set.name');

  constructor() {
    super({
      options: [
        {name: 'nickname', description: 'Nickname to set ({name}, {user}, {discrim}, and {guild} are replaced)', ...I18n.optionLocalizations('commands.moderation.nick_mass.set.nickname'), required: true},
        ...nickMassFilterOptions('commands.moderation.nick_mass.set'),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return createNickMassMessage(context, {...args, text: args.nickname});
  }
}
