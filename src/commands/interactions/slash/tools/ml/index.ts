import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { ToolsMLEditCommand } from './edit';
import { ToolsMLImagineCommand } from './imagine';
import { ToolsMLInterrogateCommand } from './interrogate';
import { ToolsMLReimagineCommand } from './reimagine';


export class ToolsMLGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'ml';

  constructor() {
    super({
      options: [
        new ToolsMLEditCommand(),
        new ToolsMLImagineCommand(),
        new ToolsMLInterrogateCommand(),
        new ToolsMLReimagineCommand(),
      ],
    });
  }
}
