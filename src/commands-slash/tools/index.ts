import { BaseCommand } from '../basecommand';

import { ToolsHashCommand } from './hash';


export default class ToolsGroupCommand extends BaseCommand {
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
