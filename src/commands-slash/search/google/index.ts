import { BaseCommand } from '../../basecommand';

import { GoogleImagesCommand } from './google.images';
import { GoogleSearchCommand } from './google.search';


export default class GoogleCommand extends BaseCommand {
  description = 'ull never see this';
  name = 'google';

  constructor() {
    super({
      options: [new GoogleSearchCommand(), new GoogleImagesCommand()],
    });
  }
}
