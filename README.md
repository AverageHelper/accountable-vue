# Accountable

A Vue app for managing monetary assets. All data is encrypted client-side and stored on a server that you control.

> This project is undergoing rapid development and should be considered experimental. Use it at your own risk. 🤙

Note: DO NOT FORGET your ACCOUNT ID or PASSWORD. If you do, your data is irretrievably lost. You have been warned. :)

Also note: This project is UNSTABLE for the moment, at least until it hits a proper 1.0 release. Feel free to try it out and let me know of any issues. Until I can trust this software, you probably should not trust it either.

### Alternative Projects

There are many open-source balance keepers out there, but none I've found that I quite like. A few are listed [here](https://opensource.com/life/17/10/personal-finance-tools-linux).

### The Goal

The aim of Accountable is to be cross-platform and portable. Eventually, I plan to have an Android client on the F-droid store, an iOS app on the App Store, and a website as well. The self-host option will always be available to all clients, and I intend for this project to always be open-source.

## Setup

### Prerequesites

This project requires NPM v7 or above. You can check what version you have installed by running `npm -v`:

```sh
$ npm -v
7.20.3
```

### Installation

- Clone the repository
- Set up the Accountable server on a machine you can access from your network (instructions coming soon™)
- Save the server's URL to a .env file at the root of the project, as shown below:

```sh
# .env
# Vite pulls these in at build time

# Where your server lives
VITE_ACCOUNTABLE_SERVER_URL={your server URL here}:40850

# Enables the "Login" menu item
VITE_ENABLE_LOGIN=true
```

#### Compile from source

```sh
$ cd accountable-vue
$ npm install
$ npm run build
```

#### Run

To start the server and client on the same machine, run the following command:

```sh
$ npm start
```

Vite will give your a URL to paste into your browser. It should look something like [http://localhost:3000/](http://localhost:3000/). Give that a go, and you're off to the races!

To run the server on its own, run the following command instead:

```sh
$ npm run prod:server
```

I recommend you install the client (the contents of the `<repository root>/dist` folder) on a webserver.

TODO: Work out how the hay to securely manage .env secrets on a webserver. XD

Since all the Accountable client is the URL to the Accountable server, you should be fine to publish the .env folder with the client stuff. (If anything goes wrong, that's on you. [Submit an issue](https://github.com/AverageHelper/accountable-vue/issues/new/choose) detailing what you think I can do to make this safer.)

## Acknowledgements

- Icons from [iconmonstr](https://iconmonstr.com/)

## Contributing

This project is entirely open source. Do with it what you will. If you're willing to help me improve this project, consider [filing an issue](https://github.com/AverageHelper/accountable-vue/issues/new/choose).

🧐 If you're feeling especially fantastic you might consider contributing to the project directly:

1. Fork this project.
2. Make your changes. Recommended IDE Setup: [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar)
3. Submit a PR. (GitHub will ping me for you, so no need to @ me)

I don't have all the time in the world, so PRs are especially appreciated.
