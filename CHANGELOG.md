# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- Port everything to Svelte.

## [0.9.1] - 2022-07-12
### Fixed
- Don't delete EVERY ATTACHMENT FILE when deleting unrelated documents.

## [0.9.0] - 2022-07-12
### Changed
- Large file storage is now handled in the same set of API endpoints as database storage, to simplify documentation.
- Large files are ingested first to a system-determined temporary directory, then moved into their permanent spot on the filesystem.
- Use [`multer`](https://www.npmjs.com/package/multer) instead of [`busboy`](https://www.npmjs.com/package/connect-busboy) for processing files.

### Security
- Updated [`nodemon`](https://www.npmjs.com/package/nodemon), which removed a lot of useless dependencies and solved a test-time vulnerability.

## [0.8.1] - 2022-07-02
### Added
- **Client:** We now show what the account's balance was at each transaction.
- **Client:** Transactions now show their `isReconciled` status on their detail page.

### Changed
- **Client:** Some smol code helps to make certain things easier to implement
- **Server:** Disabled throttling on the `GET /session` endpoint. It was getting annoying having to restart the server every other time I refreshed the page. I'll re-enable throttling there after some rethinking.

### Fixed
- **Client:** We now properly clear the location and transaction caches on lock/logout
- **Client:** We now sort months more consistently in reverse-chronological order. For real this time. (Probably.)

## [0.8.0] - 2022-07-02
### Added
- **Server:** Log the current server version on startup
- **Server:** Added support for our new `cryption` document attribute (#45)

### Changed
- **Client:** Refactored our local data model definitions from `class` declarations to `interface` definitions and pure functions.
- **Client:** Did some research on [how crypto-js handles its key size config](https://cryptojs.gitbook.io/docs/#pbkdf2), discovered the likely reason why my PBKDF call takes so much time: It turns out that `keySize` is in _words_, not _bytes_. I think my keys are 8,192 bits long. I'm sorry.
- **Client:** Reorganized cryption stuff to make migration easier
- **Server:** Log the result of each CORS check
- **Server:** Removed some useless dependencies (#44)

### Fixed
- **Server:** Send cookies with request responses

## [0.7.0] - 2022-06-30
### Added
- **Client:** Introduced a "Lock" mechanism. Since we now keep the login token in the browser with a cookie, rather than in JavaScript that we control manually, the app can keep its login state between refreshes. However, the user's password—which is used for decryption—isn't kept in any persistent way, so we must ask the user again for that information. The "Locked" screen will appear when we have an auth token, but still need the user password to read the user's data.
- **Client:** Start internationalizing our user-facing strings
- **Client:** Added a button to clear the search query

### Changed
- **Client:** We shouldn't keep the login token anywhere that JavaScript can get to it. The client no longer sends a token directly via the API, but instead returns its cookies via standard HTTP semantics. We assume that auth state is handled in an [`HttpOnly`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security) cookie, so we don't try to receive or send a JWT when interacting with the server.
- **Server:** The server still accepts `Authentication` tokens, but now also accepts a cookie. The server now sets an [`HttpOnly`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#security) cookie with the login token so that the web client doesn't have to handle the auth token itself.

### Security
- **Server:** Fixed a path traversal exploit in the file storage endpoint. (Thanks to [Snyk](https://snyk.io/) for pointing that out to me!)

## [0.6.4] - 2022-06-08
### Added
- Added a way for folks to support this project
- **Server:** Send consistent error codes to provide more context to error responses

### Changed
- **Client:** Use error codes instead of the server's default error message, to make eventual internationalization easier

## [0.6.3] - 2022-06-07
### Changed
- Minor internal changes to make future maintenance easier

### Fixed
- **Server:** We now validate incoming JWT payload structures (using Joi)

## [0.6.2] - 2022-06-03
### Added
- **Client:** Add an env variable to toggle signup UI

### Fixed
- **Server:** The `/join` endpoint now respects the internal `MAX_USERS` variable to prevent new signups if we've exceeded the limit

## [0.6.1] - 2022-05-28
### Changed
- **BREAKING:** All API routes now have a `/v0` prefix to them. Old routes will not work. I won't bother with redirects, since we've not even hit a proper 1.0 build yet.
- **Client:** Don't hard-code route paths. That was always gross. Why did I do that?

### Fixed
- **Client:** Months weren't sorted properly

## [0.6.0] - 2022-05-28
### Changed
- **Client:** Group transactions by month in the Account view. This should mean less rendering time for long transaction lists.

## [0.5.7] - 2022-05-13
### Changed
- **Client:** Use the browser's native date/time picker, now that there's a widely-accepted native one. Still need to handle time zones somehow, but at least this input knows that 1 May 2022 is a _Sunday_ and not a _Tuesday_ lol

## [0.5.6] - 2022-04-04
### Changed
- **Client:** Use 24-hr time. It is superior.

### Security
- Fixed a vulnerable dependency.

## [0.5.5] - 2022-03-14
### Changed
- **Client:** Improved layout for the tag picker

## [0.5.4] - 2022-03-12
### Changed
- **Client:** Move major page components out of the generic `components` directory
- **Server:** Move error definitions to a special `errors` directory
- **Server:** Prevent users from uploading larger attachments than their storage space allotment

## [0.5.3] - 2022-02-25
### Added
- **Client:** Click an existing tag to add it to the transaction

### Fixed
- **Client:** Fixed a bug that caused an account's total to double when the user opened the account view

## [0.5.2] - 2022-02-21
### Fixed
- Fixed a bug where the Accounts list would fail to prefetch transactions in all accounts but one (if the user had more than one account)
- Probably fixed a bug that prevented watchers from restarting themselves in the event of failure

## [0.5.1] - 2022-02-19
### Added
- **Client:** The tab bar now joins the side menu on small screens

### Fixed
- **Client:** Fixed weirdness when entering a negative amount into `CurrencyInput`

Known issues:
- Light mode doesn't exist anymore. I'll turn it back on when I've had time to design it better
- The accounts list disappears with an error, something to do with server connection. I'm not sure why this happens, or why the Reload button doesn't work.

## [0.5.0] - 2022-02-18
### Added
- **Server:** Add a basic `ping` REST endpoint
- **Server:** Add a basic `version` REST endpoint
- **Server:** Inform clients of their disk usage after every write
- **Server:** Keep track of how much space users use, and don't let them exceed their limit
- **Server:** Establish a "Ping" protocol for our websocket
  - Automatically tear down websocket if the client stops responding for a while
- **Client:** Show the current server version in the footer
- **Client:** Respond to the server's websocket pings so the server knows whether we've died
- **Client:** Make disk usage information available in the corner menu

### Changed
- **Server:** Re-enable request throttling by IP address
- **Client:** Better frontend reporting of websocket errors

## [0.4.3] - 2022-02-16
### Added
- Add a URL path to get to the signup form directly

### Changed
- Rename "password" to "passphrase" externally

## [0.4.2] - 2022-02-16
### Added
- Use new file uploads to reattach broken attachments
- Better search UI for transactions

## [0.4.1] - 2022-02-15
### Added
- Accountable can now handle importing zip files in excess of 5 GB. Not sure what the upper limit is.
- Attachment import is still quite broken for imports that massive; something takes too much memory to get it done. Not sure if that's on the client or the server. Needs more investigation.

## [0.4.0] - 2022-02-01
### Added
- Implement proper batched writes
  - I _should_ handle data races properly, but this was a lot more fun! (Also it's just me who uses the app at a time, so this lets me put off MongoDB for a while longer.)

### Changed
- [BREAKING] Some fixes to the way account creation happens. No more extra data dirtying up the user's preferences and confusing the client.

## [0.3.4] - 2022-01-31
### Changed
Just some re-working to make our vendor bundle fit within the recommended 500 KiB:
- Replace [Joi](https://github.com/sideway/joi) with [Superstruct](https://www.npmjs.com/package/superstruct) on the client
- Tree-shake away Bootstrap's JavaScript bundle. Use Vue's own state mechanics instead.

## [0.3.3] - 2022-01-31
### Added
- Implement account deletion

### Fixed
- Fix CSS bugs around the signup flow

## [0.3.2] - 2022-01-31
### Fixed
- Filter transactions properly by account
- Make file uploads work again

## [0.3.1] - 2022-01-26
### Added
- Added a proper homepage.

## [0.3.0] - 2022-01-18
### Changed
- Move to our own server code. This is a breaking change (since we don't have any way of migrating from Firebase at the moment).

## [0.2.0] - 2021-11-30
### Fixed
- Data exports don't need to duplicate location, tag, and attachment metadata. Fixed that.

## [0.1.0] - 2021-11-28
### Added
- Initial prerelease

## [Initial commit] - 2021-10-01
### Added
- Initial commit

[Unreleased]: https://github.com/AverageHelper/accountable-vue/compare/v0.9.1...HEAD
[0.9.1]: https://github.com/AverageHelper/accountable-vue/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/AverageHelper/accountable-vue/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/AverageHelper/accountable-vue/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/AverageHelper/accountable-vue/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/AverageHelper/accountable-vue/compare/v0.6.4...v0.7.0
[0.6.4]: https://github.com/AverageHelper/accountable-vue/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/AverageHelper/accountable-vue/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/AverageHelper/accountable-vue/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/AverageHelper/accountable-vue/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/AverageHelper/accountable-vue/compare/v0.5.7...v0.6.0
[0.5.7]: https://github.com/AverageHelper/accountable-vue/compare/v0.5.6...v0.5.7
[0.5.6]: https://github.com/AverageHelper/accountable-vue/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/AverageHelper/accountable-vue/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/AverageHelper/accountable-vue/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/AverageHelper/accountable-vue/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/AverageHelper/accountable-vue/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/AverageHelper/accountable-vue/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/AverageHelper/accountable-vue/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/AverageHelper/accountable-vue/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/AverageHelper/accountable-vue/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/AverageHelper/accountable-vue/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/AverageHelper/accountable-vue/compare/v0.3.4...v0.4.0
[0.3.4]: https://github.com/AverageHelper/accountable-vue/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/AverageHelper/accountable-vue/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/AverageHelper/accountable-vue/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/AverageHelper/accountable-vue/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/AverageHelper/accountable-vue/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/AverageHelper/accountable-vue/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/AverageHelper/accountable-vue/releases/tag/v0.1.0
[Initial commit]: https://github.com/AverageHelper/accountable-vue/commit/959ea3d235490742897b4bae8f26b36e957a0eeb
