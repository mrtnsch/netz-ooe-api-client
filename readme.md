# Netz OÖ API Client
## About
This project provides a basic implementation of a simple API client for the undocumented API of the Austrian grid operator Netz OÖ.
<br><br>
*CAUTION:* The entire API is undocumented and might break any time. Do not use for anything critical.
<br>
<br>
Any contributions are highly welcome!
## Usage
### Instantiating a client
Simply pass your Netz OÖ username and password to the client like so:
```typescript
import {
    NetzOoeApiClient,
    Credentials
} from 'netz-ooe-api-client'

const credentials: Credentials = {
    "j_username": "eservice_username_here",
    "j_password": "eservice_password_here"
}
const client = new NetzOoeApiClient(credentials)
```
### Authenticating
Once you have the client, you need to perform the authentication flow like this:
```typescript
await client.performAuthFlow()
```
This will perform a series of requests necessary to authenticate against the API and obtain the required cookies and tokens.
<br>
*Caution:* There currently is no mechanism in place to reauthenticate automatically when the session expires.
### Get data for a single meter
```typescript
const exampleRequest = {
    "dimension": "ENERGY",
    "pods": [
        {
            "contractAccountNumber": "Vertragskontonummer_goes_here",
            "meterPointAdministrationNumber": "Zählpunktnummer_goes_here",
            "type": "ACTIVE_CURRENT",
            "timerange": {
                "from": "2024-02-01",
                "to": "2024-02-01"
            },
            "bestAvailableGranularity": "QUARTER_OF_AN_HOUR"
        }
    ]
}
const meterData = await client.getMeterData(exampleRequest)
```
Please note: `QUARTER_OF_AN_HOUR` granularity is only available when a single day is requested.
### Get dashboard view
To get an overview of the available smart meters, you can use this request.
```typescript
const dashboardView = await client.getDashboardView();
```
## Todos
* Proper error handling
* Automating the authentication, reauthenticate after session expires
* Documentation
