import {
  ClusterClient,
  SlashCommandClient,
  SlashCommandClientOptions,
  SlashCommandClientRunOptions,
} from 'detritus-client';


export interface NotSoSlashClientOptions extends SlashCommandClientOptions {
  directory: string, 
}

export interface NotSoSlashClientRunOptions extends SlashCommandClientRunOptions {
  directory?: string,
}

export class NotSoSlashClient extends SlashCommandClient {
  directory?: string;

  constructor(
    options: NotSoSlashClientOptions,
    token?: ClusterClient | string,
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

  async run(options: NotSoSlashClientRunOptions = {}) {
    this.directory = options.directory || this.directory;
    if (this.directory) {
      await this.resetCommands();
    }
    return super.run(options);
  }
}
