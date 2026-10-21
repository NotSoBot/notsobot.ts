import { I18n } from '../../../../../utils';

import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ToolsQrCreateCommand } from './create';
import { ToolsQrScanCommand } from './scan';


export class ToolsQrGroupCommand extends BaseInteractionCommandOptionGroup {
  description = 'Create and scan QR codes';
  descriptionLocalizations = I18n.localizations('commands.tools.qr.description');
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
