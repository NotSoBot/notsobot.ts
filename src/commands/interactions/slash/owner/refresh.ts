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
        {name: 'pull', description: 'First pull the latest code from GitHub (git pull)', ...I18n.optionLocalizations('commands.owner.refresh.pull'), type: Boolean},
        {name: 'respawn', description: 'Then respawn every cluster one at a time (what refresh can\'t swap in)', ...I18n.optionLocalizations('commands.owner.refresh.respawn'), type: Boolean},
        {name: 'voice', description: 'Also reload the voice node client (hands its sessions over)', ...I18n.optionLocalizations('commands.owner.refresh.voice'), type: Boolean},
      ],
    });
  }

  async run(context: Interaction.InteractionContext, args: Formatter.Commands.OwnerRefresh.CommandArgs) {
    return Formatter.Commands.OwnerRefresh.createMessage(context, {pull: !!args.pull, respawn: !!args.respawn, voice: !!args.voice});
  }
}
