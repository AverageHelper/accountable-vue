# Accountable

A Vue app for managing monetary assets. All data is encrypted client-side and stored in a Firebase instance that you control.

Note: DO NOT FORGET your ACCOUNT ID or PASSWORD. If you do, your data is irretrievably lost. You have been warned. :)

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
- Set up a [Firebase](https://firebase.google.com/) project
- Under "Your apps" select the Web platform and register a Firebase app
- Note your app's `apiKey`, `projectId`, and `authDomain`
- Save these values to a .env file at the root of the project, as shown below:

```sh
# .env
# Vite pulls these in at build time

VITE_FIREBASE_API_KEY={your API key here}
VITE_FIREBASE_STORAGE_BUCKET={your storage bucket here}
VITE_FIREBASE_AUTH_DOMAIN={your auth domain here}
VITE_FIREBASE_PROJECT_ID={your project ID here}
```

#### Install dependencies and run!

```sh
$ cd accountable-vue
$ npm install
$ npm run export-version
```

#### Twiddle with Google Cloud Storage

This is necessary for now. We're looking into alternatives.

```sh
$ gcloud auth login # log in using your project Google account
$ gcloud config set project <your-project-ID>
$ gsutil cors set cors.json gs://<your-cloud-storage-bucket>
```

See [Google's docs on the subject](https://firebase.google.com/docs/storage/web/download-files#cors_configuration).

#### (Optional) Enable IP-based geolocation with FreeGeoIp

We don't talk to external APIs without your express consent. When enabled and requested, this information is used only to quickly add your current location to a transaction. Even when the feature is enabled, you must press a button before we make the location request.

If you wish to enable location features, go to [FreeGeoIp](https://freegeoip.app) and register for an API key. Then paste that key into `VITE_FREEGEOIP_API_KEY` in your .env file.

```sh
...
VITE_FREEGEOIP_API_KEY={your key here}
```

#### Run!

```sh
$ npm start
```

Vite will give your a URL to paste into your browser. It should look something like [http://localhost:3000/](http://localhost:3000/). Give that a go, and you're off to the races!

## Contributing

This project is entirely open source. Do with it what you will. If you're willing to help me improve this project, consider [filing an issue](https://github.com/AverageHelper/accountable-vue/issues/new/choose).

🧐 If you're feeling especially fantastic you might consider contributing to the project directly:

- Fork this project.
- Make your changes. Recommended IDE Setup: [VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar)
- Submit a PR. (GitHub will ping me for you, so no need to @ me)

I don't have all the time in the world, so PRs are especially appreciated.
