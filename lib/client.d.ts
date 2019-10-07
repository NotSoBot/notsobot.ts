import { CommandClient, CommandClientOptions, CommandClientRunOptions } from 'detritus-client';
export interface NotSoClientOptions extends CommandClientOptions {
    directory: string;
    directoryIsAbsolute?: boolean;
}
export interface NotSoClientRunOptions extends CommandClientRunOptions {
    directory?: string;
    directoryIsAbsolute?: boolean;
}
export declare class NotSoClient extends CommandClient {
    directory?: string;
    directoryIsAbsolute: boolean;
    constructor(options: NotSoClientOptions, token?: string);
    resetCommands(): Promise<void>;
    run(options?: NotSoClientRunOptions): Promise<import("detritus-client").ClusterClient | import("detritus-client").ShardClient>;
}
