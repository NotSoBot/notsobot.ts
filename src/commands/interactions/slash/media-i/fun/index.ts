import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { MediaIBillCommand } from './bill';
import { MediaIBurnCommand } from './burn';
import { MediaILatteCommand } from './latte';


export class MediaFunGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'fun';

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
