import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { OwnerGuildFeaturesAddCommand } from './add';
import { OwnerGuildFeaturesRemoveCommand } from './remove';


export class OwnerGuildFeaturesGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Manage guild features';
  descriptionLocalizations = I18n.localizations('commands.owner.guild_features.description');
  name = 'guild-features';
  nameLocalizations = I18n.localizations('commands.owner.guild_features.name');

  constructor() {
    super({
      options: [
        new OwnerGuildFeaturesAddCommand(),
        new OwnerGuildFeaturesRemoveCommand(),
      ],
    });
  }
}
