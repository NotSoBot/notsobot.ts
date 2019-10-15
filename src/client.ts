import {
  CommandClient,
  CommandClientOptions,
  CommandClientRunOptions,
} from 'detritus-client';


export interface NotSoClientOptions extends CommandClientOptions {
  directory: string, 
}

export interface NotSoClientRunOptions extends CommandClientRunOptions {
  directory?: string,
}

export class NotSoClient extends CommandClient {
  directory?: string;

  constructor(
    options: NotSoClientOptions,
    token?: string,
  ) {
    super(token || '', options);

    if (options.directory) {
      this.directory = options.directory;
    }
  }

  async resetCommands(): Promise<void> {
    this.clear();
    if (this.directory) {
      await this.addMultipleIn(this.directory, {subdirectories: true});
    }
  }

  async run(options: NotSoClientRunOptions = {}) {
    this.directory = options.directory || this.directory;
    if (this.directory) {
      await this.resetCommands();
    }
    return super.run(options);
  }
}
