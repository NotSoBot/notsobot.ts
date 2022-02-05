import { BaseSlashCommand } from '../../basecommand';

import { ToolsHashCommand } from './hash';
import { ToolsScreenshotCommand } from './screenshot';


export default class ToolsGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'tools';

  constructor() {
    super({
      options: [
        new ToolsHashCommand(),
        new ToolsScreenshotCommand(),
      ],
    });
  }
}
