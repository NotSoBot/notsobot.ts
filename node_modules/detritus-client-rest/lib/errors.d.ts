import { Response } from 'detritus-rest';
declare class BaseError extends Error {
}
export declare class HTTPError extends BaseError {
    code: any;
    response: Response;
    constructor(response: Response, message?: string, code?: any);
}
export interface DiscordHTTPValueErrorBody {
    code: string;
    message: string;
}
export interface DiscordHTTPValueError {
    _errors?: Array<DiscordHTTPValueErrorBody>;
    [key: string]: DiscordHTTPValueError | Array<DiscordHTTPValueErrorBody> | undefined;
}
export interface DiscordHTTPErrorOptions {
    code: number;
    errors?: DiscordHTTPValueError;
    message: string;
}
export declare class DiscordHTTPError extends HTTPError {
    code: number;
    errors?: DiscordHTTPValueError;
    raw: DiscordHTTPErrorOptions;
    constructor(response: Response, raw: DiscordHTTPErrorOptions);
}
export {};
