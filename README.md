# Auto Updater
Angular 1.x manager service for all things that have to automatically update with REST calls.

In Action: https://plnkr.co/edit/mip8cC?p=preview

## Dependencies
* Angular.js 1.x
* Font-Awesome (used only in the base auto-updating-directive's template for a spinner)

## Usage
* Include cpc.autoupdater.js in your source files.
* Inject cpc.autoupdater as a dependency.
* Create a directive that uses the auto-updating-directive in its template.
* Feed an updater function to your directive.
* Use your directive.

## To register an updater you need
1) updaterFunction (required):
* The function that will be run for you in an $interval.
* This function must either return a promise, or the data you want to display.

2) updaterName (optional): 
* The unique key by which this updater will be known to the Service.
* You can provide this yourself, or the Service will generate a random one for you.
* You can call the updater later if you have this key.

3) updaterConfig (optional):
* A configuration object for the updater. 
* If you need to pass variabled into your updaterFunction, put them in the updaterConfig.functionParams array.

## Configuring an updater
refreshTimer: 10000, // The time to wait between calls, in milliseconds.

maxFailures: 2, // If the http call fails this many times, the updater stops trying.

maxFailuresMagicNumber: -1, // If you set maxFailures to this number, the updater will NEVER stop trying.

failureText: '?', // The text to display when an updater is in a failure state.

failureTitle: 'Could not update.', // The HTML title text of an updater in a failure state.

autoStart: true, // If === false, the Service will not auto-start this updater.  The allows you to initialize an updater, and start it later.

waitForMe: null, // A promise which, if available, the Service will wait for it to resolve before starting the updater.

broadcastEvent: null, // The name of an event to broadcast on $rootScope when an update is available.

listenForEvent: null, // The name of an event to listen for on the base directive and trigger an update.

functionParams: [], // An array that will become the passedFunction's parameters.  Only supports numerically-indexed parameters like functionParams[1].  Trying functionParams["foo"] will not work.

loadingClass: 'fa fa-spinner fa-spin', // The default loading spinner icon.

## Logging
This module uses $log.debug throughout.  If you want to see the logging output, set $logProvider.debugEnabled(true).

Most logging output will just give you a sense of what functions fire and when.