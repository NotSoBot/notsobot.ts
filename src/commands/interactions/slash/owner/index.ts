import { BaseSlashCommand } from '../../basecommand';

import { OwnerEvalCommand } from './eval';


export default class OwnerGroupCommand extends BaseSlashCommand {
  description = 'Owner Only Commands';
  name = 'owner';

  constructor() {
    super({
      options: [
        new OwnerEvalCommand(),
      ],
    });
  }
}
