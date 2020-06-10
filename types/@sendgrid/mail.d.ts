export = index;
declare const index: {
    MailService: Function;
    client: {
        apiKey: string;
        createHeaders: Function;
        createRequest: Function;
        defaultHeaders: {
            Accept: string;
            "User-agent": string;
        };
        defaultRequest: {
            baseUrl: string;
            headers: {};
            json: boolean;
            method: string;
            url: string;
        };
        request: Function;
        setApiKey: Function;
        setDefaultHeader: Function;
        setDefaultRequest: Function;
    };
    send: Function;
    sendMultiple: Function;
    setApiKey: Function;
    setClient: Function;
    setSubstitutionWrappers: Function;
    substitutionWrappers: string[];
};
