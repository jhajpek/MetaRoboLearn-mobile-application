class BrokerClient {
    constructor(brokerUrl, clientName, apiKey) {
        this.brokerUrl = brokerUrl;
        this.clientName = clientName;
        this.apiKey = apiKey;
        this.clientId = null;
        this.token = null;
    }

    async login() {
        const response = await fetch(`${this.brokerUrl}/client/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "client-name": this.clientName,
                "api-key": this.apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.statusText}`);
        }

        const data = await response.json();
        this.clientId = data.ClientId;
        this.token = data.Token;
        console.log(`Logged in with client_id: ${ this.clientId }`);
    }

    getAuthHeaders() {
        return {
            "Content-Type": "application/json",
            "client-id": this.clientId,
            "token": this.token
        };
    }

    async requestWithAuth(path, options = {}) {
        if (!this.token) {
            await this.login();
        }

        let response = await fetch(`${this.brokerUrl}${path}`, {
            ...options,
            headers: {
                ...this.getAuthHeaders(),
                ...options.headers,
            },
        });

        if (response.status === 401 || response.status === 403) {
            console.log("Token expired, re-authenticating...");
            await this.login();
            response = await fetch(`${this.brokerUrl}${path}`, {
                ...options,
                headers: {
                    ...this.getAuthHeaders(),
                    ...options.headers,
                },
            });
        }

        if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`);
        }

        return response;
    }
}

export default BrokerClient;
