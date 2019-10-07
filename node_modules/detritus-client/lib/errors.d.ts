declare class BaseError extends Error {
    toJSON(): {
        message: string;
        name: string;
        stack: string | undefined;
    };
}
export declare class ClusterIPCError extends BaseError {
    name: string;
    stack: string;
    constructor(error: {
        message: string;
        name: string;
        stack: string;
    });
}
export declare class GatewayHTTPError extends BaseError {
    httpError: any;
    constructor(message: string, httpError: any);
}
export declare class ImportedCommandsError extends BaseError {
    errors: {
        [key: string]: Error;
    };
    constructor(errors: {
        [key: string]: Error;
    });
}
export {};
