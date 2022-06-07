# Accountable Server

The machine that stores stuff.

> This project is undergoing rapid development and should be considered experimental. Use it at your own risk. 🤙

## API

This server doesn't do much on its own once you're authenticated. You give it data, and you ask for that data back. If you want to encrypt that data, do that yourself before you send it.

The API is documented using [OpenAPI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/AverageHelper/accountable-vue/main/server/openapi.yaml).

## Setup

### Prerequesites

This project requires Node 16 and NPM v7 or above. You can check what versions you have installed by running `npm -v` and `node -v`:

```sh
$ npm -v && node -v
8.1.2
v16.13.1
```

### Compile and Run the Server

- Clone the repository
- Create a .env file at the root of the `server` folder, like the one shown below:

```sh
# .env

# Where your attachment data lives
DB={path to your storage directory}
# defaults to "<project root>/server/db"

HOST={your frontend hostname, with protocol}
# ex: HOST=https://example.com

MAX_USERS={the limit to the number of users allowed to register new accounts}
# defaults to 5

MAX_BYTES={the total number of bytes that Accountable attachments are permitted to occupy on the system}
# defaults to 20000000000 (20 GB)
```

Run these commands to compile and run

```sh
$ cd accountable-vue/server  # Be in the server directory (if you aren't already)
$ npm ci                     # Install dependencies
$ npm run build              # Compile the server
$ node .                     # Start the server in development mode
```

I recommend using something like [PM2](https://pm2.keymetrics.io) to run the server properly. (Instructions coming soon™)

## Contributing

This project is entirely open source. Do with it what you will. If you're willing to help me improve this project, consider [filing an issue](https://github.com/AverageHelper/accountable-vue/issues/new/choose).

See [CONTRIBUTING.md](/CONTRIBUTING.md) for ways to contribute.
