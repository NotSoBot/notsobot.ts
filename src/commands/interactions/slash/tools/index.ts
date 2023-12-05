import { BaseSlashCommand } from '../../basecommand';

import { ToolsDownloadCommand } from './download';
import { ToolsHashCommand } from './hash';
import { ToolsMathCommand } from './math';
import { ToolsScreenshotCommand } from './screenshot';

import { ToolsQrGroupCommand } from './qr';


export default class ToolsGroupCommand extends BaseSlashCommand {
  description = 'Tool-like Commands';
  name = 'tools';

  constructor() {
    super({
      options: [
        new ToolsDownloadCommand(),
        new ToolsHashCommand(),
        new ToolsMathCommand(),
        new ToolsScreenshotCommand(),
        new ToolsQrGroupCommand(),
      ],
    });
  }
}
