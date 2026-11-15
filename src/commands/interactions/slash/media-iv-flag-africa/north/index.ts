import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIVFlagAlgeriaCommand } from './algeria';
import { MediaIVFlagLibyaCommand } from './libya';
import { MediaIVFlagMoroccoCommand } from './morocco';
import { MediaIVFlagSudanCommand } from './sudan';
import { MediaIVFlagTunisiaCommand } from './tunisia';


export class MediaIVFlagAfricaNorthGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'North African Flag Commands';
  descriptionLocalizations = I18n.localizations('commands.media_iv_flag_africa.north.description');
  name = 'north';
  nameLocalizations = I18n.localizations('commands.media_iv_flag_africa.north.name');

  constructor() {
    super({
      options: [
        new MediaIVFlagAlgeriaCommand(),
        new MediaIVFlagLibyaCommand(),
        new MediaIVFlagMoroccoCommand(),
        new MediaIVFlagSudanCommand(),
        new MediaIVFlagTunisiaCommand(),
      ],
    });
  }
}
