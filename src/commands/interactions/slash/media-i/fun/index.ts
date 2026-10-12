import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIBillCommand } from './bill';
import { MediaIBurnCommand } from './burn';
import { MediaILatteCommand } from './latte';


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';
  nameLocalizations = I18n.localizations('commands.media_i.fun.name');

  constructor() {
    super({
      options: [
        new MediaIBillCommand(),
        new MediaIBurnCommand(),
        new MediaILatteCommand(),
      ],
    });
  }
}
