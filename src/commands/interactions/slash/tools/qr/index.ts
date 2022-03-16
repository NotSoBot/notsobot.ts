import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ToolsQrCreateCommand } from './create';
import { ToolsQrScanCommand } from './scan';


export class ToolsQrGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'qr';

  constructor() {
    super({
      options: [
        new ToolsQrCreateCommand(),
        new ToolsQrScanCommand(),
      ],
    });
  }
}
