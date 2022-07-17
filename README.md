# Accountable

[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/AverageHelper/accountable-vue.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/AverageHelper/accountable-vue/context:javascript) [![Total alerts](https://img.shields.io/lgtm/alerts/g/AverageHelper/accountable-vue.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/AverageHelper/accountable-vue/alerts/)

A Vue app for managing monetary assets. All data is encrypted client-side and stored on a server that you control.

> This project is undergoing rapid development and should be considered experimental. Use it at your own risk. 🤙

### Alternative Projects

There are many open-source balance keepers out there, but none I've found that I quite like. A few are listed [here](https://opensource.com/life/17/10/personal-finance-tools-linux).

### The Goal

The aim of Accountable is to be cross-platform and portable. Eventually, I plan to have an Android client on the F-droid store, an iOS app on the App Store, and a website as well. The self-host option will always be available, and I intend for this project to always be open-source.

## Setup

### Prerequesites

To run the app in your browser, you'll need one of the following browsers and versions:
- Chrome >=87
- Firefox >=78
- Safari >=13
- Edge >=88

(I've not tested any of these boundaries, but [Vite.js recommends them](https://vitejs.dev/guide/migration.html#modern-browser-baseline-change).)

Developing for this project requires Node 14.18 and NPM v7 or above. You can check what versions you have installed by running `npm -v` and `node -v`:

```sh
$ npm -v && node -v
8.1.2
v16.13.1
```

### Compile and Run the Server

See [the server's README](/server/README.md) for info on that.

<!-- TODO: Add a note here about our own hosted solution -->

### Compile and Run the Client

- Clone the repository
- Create a .env file at the root of the project, like the one shown below:

```sh
# .env

# Where your server lives
VITE_ACCOUNTABLE_SERVER_URL={your Accountable backend URL here}:40850

# Enable the "Login" menu item
VITE_ENABLE_LOGIN=true

# Enable the "signup" behaviors
VITE_ENABLE_SIGNUP=false
```

If you're hosting the Accountable server on the same machine that hosts the Accountable client, do NOT use `localhost` for the `VITE_ACCOUNTABLE_SERVER_URL`. You must set this to a URL that _clients_—that is, web browsers—can use to access your Accountable backend.

Using `localhost` for this will cause clients to try _themselves_ as the Accountable server, and that's usually not what you want.

```sh
$ cd accountable-vue          # Be in the root directory
$ npm ci                      # Install dependencies
$ npm run build:client:quick  # Compile the client
$ npm run dev:client          # Start a local webserver
```

> Note: The build script injects your .env values at build time. If you must change .env, remember to re-build the client.

The webserver will print a URL in your terminal to paste into your browser. It should look something like [http://127.0.0.1:5173](http://127.0.0.1:5173). Give that a go, and you're off to the races!

I recommend you deploy the client (the contents of the `accountable-vue/dist` folder) on a webserver like [nginx](https://nginx.org/en/).

DO NOT FORGET your Accountable ACCOUNT ID or PASSWORD. If you do, your data is irretrievably lost. You have been warned. :)

## Acknowledgements

- Icons from [iconmonstr](https://iconmonstr.com/)

## Contributing

This project is entirely open source. Do with it what you will. If you're willing to help me improve this project, consider [filing an issue](https://github.com/AverageHelper/accountable-vue/issues/new/choose).

See [CONTRIBUTING.md](/CONTRIBUTING.md) for ways to contribute.
