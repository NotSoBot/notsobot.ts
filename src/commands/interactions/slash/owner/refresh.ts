import { Interaction } from 'detritus-client';

import { Formatter, I18n } from '../../../../utils';

import { BaseOwnerCommandOption } from './base';


export const COMMAND_NAME = 'refresh';

export class OwnerRefreshCommand extends BaseOwnerCommandOption {
  description = 'Reload the bot\'s commands';
  descriptionLocalizations = I18n.localizations('commands.owner.refresh.description');
  metadata = {
    id: Formatter.Commands.OwnerRefresh.COMMAND_ID,
  };
  name = COMMAND_NAME;
  nameLocalizations = I18n.localizations('commands.owner.refresh.name');

  constructor() {
    super({
      options: [
        {name: 'listeners', description: 'Also reload listeners', ...I18n.optionLocalizations('commands.owner.refresh.listeners'), type: Boolean},
        {name: 'stores', description: 'Also reload stores', ...I18n.optionLocalizations('commands.owner.refresh.stores'), type: Boolean},
        {name: 'voice', description: 'Also reload the voice node client (hands its sessions over)', ...I18n.optionLocalizations('commands.owner.refresh.voice'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerRefresh.CommandArgs) {
    return Formatter.Commands.OwnerRefresh.createMessage(context, {
      listeners: !!args.listeners,
      stores: !!args.stores,
      voice: !!args.voice,
    });
  }
}
