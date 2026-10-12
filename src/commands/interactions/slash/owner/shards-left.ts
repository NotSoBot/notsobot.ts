import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseOwnerCommandOption } from './base';


export const COMMAND_NAME = 'shards-left';

export class OwnerShardsLeftCommand extends BaseOwnerCommandOption {
  description = 'See how many identifies we have left and when it\'ll reset';
  descriptionLocalizations = I18n.localizations('commands.owner.shards_left.description');
  metadata = {
    id: Formatter.Commands.OwnerShardsLeft.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.shards_left.name');

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.OwnerShardsLeft.createMessage(context);
  }
}
