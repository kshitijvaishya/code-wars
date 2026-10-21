import 'dotenv/config';
export declare function serverlessApiPlugin(): {
    name: string;
    configureServer: (server: {
        middlewares: {
            use: (middleware: any) => void;
        };
    }) => void;
};
