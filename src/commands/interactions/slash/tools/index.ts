import { BaseSlashCommand } from '../../basecommand';

import { ToolsHashCommand } from './hash';


export default class ToolsGroupCommand extends BaseSlashCommand {
  description = '.';
  name = 'tools';

  constructor() {
    super({
      options: [
        new ToolsHashCommand(),
      ],
    });
  }
}
