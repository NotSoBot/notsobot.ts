import { BaseInteractionCommandOptionGroup } from '../../../basecommand';

import { TagImportDMCommand } from './dm';


export class TagImportGroupCommand extends BaseInteractionCommandOptionGroup {
  description = '.';
  name = 'import';

  constructor() {
    super({
      options: [
        new TagImportDMCommand(),
      ],
    });
  }
}
