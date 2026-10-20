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
  metadata = {
    id: 'moderation.nick.mass',
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.moderation.nick_mass.set.name');

  constructor() {
    super({
      options: [
        {name: 'nickname', description: 'Nickname to set, supports tagscript like {nick}, {user}, {guild} and {choose:a|b}', ...I18n.optionLocalizations('commands.moderation.nick_mass.set.nickname'), required: true},
        ...nickMassFilterOptions('commands.moderation.nick_mass.set'),
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: CommandArgs) {
    return createNickMassMessage(context, {...args, text: args.nickname});
  }
}
