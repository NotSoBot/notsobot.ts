import { BaseCommand } from '../basecommand';

import { OwnerEvalCommand } from './eval';


export default class OwnerGroupCommand extends BaseCommand {
  description = '.';
  name = 'owner';

  constructor() {
    super({
      options: [
        new OwnerEvalCommand(),
      ],
    });
  }
}
