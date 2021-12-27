# Accountable

A Vue app for managing monetary assets. All data is encrypted client-side and stored on a server that you control.

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

We also need MongoDB installed and running locally. Check out [this tutorial](https://rexben.medium.com/getting-started-with-mongodb-mongoose-2a6acbc34dd4) on how to install it on your system. Once that is installed, and MongoDB is running as a service, run the following commands:

```sh
$ mongosh           # connects `mongosh` to the running instance
> use accountable   # creates a local database called "accountable"
> exit              # returns to your shell
```

### Installation

- Clone the repository
- Set up the Accountable server on a publicly-accessible machine (instructions coming soon™)
- Note your server's public URL
- Save this value to a .env file at the root of the project, as shown below:

```sh
# .env
# Vite pulls these in at build time

VITE_ACCOUNTABLE_SERVER_URL={your server URL here}
```

#### Install dependencies, build, and run!

```sh
$ cd accountable-vue
$ npm install
$ npm run build
$ npm start
```

#### \[OBSOLETE\] Twiddle with Google Cloud Storage

This is necessary for now. We're looking into alternatives.

```sh
$ gcloud auth login # log in using your project Google account
$ gcloud config set project <your-project-ID>
$ gsutil cors set cors.json gs://<your-cloud-storage-bucket>
```

See [Google's docs on the subject](https://firebase.google.com/docs/storage/web/download-files#cors_configuration).

#### Run!

```sh
$ npm start
```

Vite will give your a URL to paste into your browser. It should look something like [http://localhost:3000/](http://localhost:3000/). Give that a go, and you're off to the races!

## Acknowledgements

- Icons from [iconmonstr](https://iconmonstr.com/)

## Contributing

This project is entirely open source. Do with it what you will. If you're willing to help me improve this project, consider [filing an issue](https://github.com/AverageHelper/accountable-vue/issues/new/choose).

🧐 If you're feeling especially fantastic you might consider contributing to the project directly:

- Fork this project.
- Make your changes. Recommended IDE Setup: [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar)
- Submit a PR. (GitHub will ping me for you, so no need to @ me)

I don't have all the time in the world, so PRs are especially appreciated.
