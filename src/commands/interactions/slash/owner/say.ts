import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseOwnerCommandOption } from './base';


export const COMMAND_NAME = 'say';

export class OwnerSayCommand extends BaseOwnerCommandOption {
  description = 'Have the bot say something';
  descriptionLocalizations = I18n.localizations('commands.owner.say.description');
  metadata = {
    id: Formatter.Commands.OwnerSay.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.say.name');

  constructor() {
    super({
      options: [
        {name: 'text', description: 'Text to say', ...I18n.optionLocalizations('commands.owner.say.text'), required: true},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerSay.CommandArgs) {
    return Formatter.Commands.OwnerSay.createMessage(context, args);
  }
}
