# Accountable

A Vue app for managing monetary assets. All data is encrypted client-side and stored in a Firebase instance that you control.

Note: DO NOT FORGET YOUR PASSWORD. Even if I could retrieve your encrypted data from your own Firestore instance (I can't) I cannot decrypt your data that you encrypted with your own password.

## Setup

- Clone the repository
- Set up a [Firebase](https://firebase.google.com/) project
- Under "Your apps" select the Web platform and register a Firebase app
- Copy your app's `apiKey`, `projectId`, and `authDomain`
- Save these values to a .env file at the root of the project

```sh
# .env

VITE_FIREBASE_API_KEY={your API key here}
VITE_FIREBASE_AUTH_DOMAIN={your auth domain here}
VITE_FIREBASE_PROJECT_ID={your project ID here}
```

Install dependencies and run!

```sh
$ cd accountable-vue
$ npm install
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
