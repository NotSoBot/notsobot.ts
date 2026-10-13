import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseInteractionCommandOption } from '../../basecommand';


export const COMMAND_NAME = 'shards';

export class UtilsShardsCommand extends BaseInteractionCommandOption {
  description = 'Show all of the bot\'s shard information';
  descriptionLocalizations = I18n.localizations('commands.utils.shards.description');
  metadata = {
    id: Formatter.Commands.UtilsShards.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.utils.shards.name');

  constructor() {
    super({
    });
  }

  async run(context: Interaction.InteractionContext) {
    return Formatter.Commands.UtilsShards.createMessage(context);
  }
}
