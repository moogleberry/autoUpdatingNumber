# Auto Updater
Angular 1.x manager service for all things that have to automatically update with REST calls.

If you want to make calls to a REST endpoint repeatedly, automatically, you want this.  

This service and directive combo gives you a great degree of control over how your updates happen.
* Want to start and stop updaters programmatically?  Can Do.
* Want the flexibility to specify a name, or not?  Can Do.
* Want updaters that will never overwhelm your server because they start their timer after the call completes?  Can Do.
* Want the timer to start when the call starts?  Also Can Do.
* Want to wait for an independent promise before running?  Can Do.
* Want to trigger updates on, or broadcast events? Can Do.
* Want to stop trying after too many failures?  Can Do.
* Want to keep trying forever?  Also Can Do.

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

## How to make my own updater directive
Make a directive that uses the `<auto-updating-directive>` in its template.

In your directive's controller, define a `$scope.passedFunction` (required).

Optionally, define other things like a `$scope.updaterName` or a `$scope.config`.

Example:
```
angular.module('cpc.autoupdater').directive('autoUpdaterTest', autoUpdaterTest);
autoUpdaterTest.$inject = ['$http'];
function autoUpdaterTest($http) {
	return {
		scope: {
			updaterName: '@'
		},
		restrict: 'E',
		template: '<auto-updating-directive updater-name="updaterName" updater-function="passedFunction" updater-config="config"></auto-updating-directive>',
		controller: function($scope) {
			// A test function to demonstrate getting and updating plain data
			var test = function() {
				return Math.floor(Math.random() * 100);
			};

			// A second test function to demonstrate getting and updating data from a promise
			var test2 = function() {
				return $http.get('').then(function() {
					return Math.floor(Math.random() * 100);
				});
			};

			$scope.passedFunction = test2;
			
			$scope.config = {
				functionParams: []
			};
		}
	};
}
```

## Configuring an updater
You can configure updaters individually with a config object, either at creation time, or later with `AutoUpdater.setConfig(configObject)`.  

You can configure all future updaters with `AutoUpdater.setDefaults(configObject)`.

A config object has the following properties:
* refreshTimer: 10000, // The time to wait between calls, in milliseconds.
* maxFailures: 2, // If the http call fails this many times, the updater stops trying.
* maxFailuresMagicNumber: -1, // If you set maxFailures to this number, the updater will NEVER stop trying.
* failureText: '?', // The text to display when an updater is in a failure state.
* failureTitle: 'Could not update.', // The HTML title text of an updater in a failure state.
* autoStart: true, // If === false, the Service will not auto-start this updater.  The allows you to initialize an updater, and start it later.
* waitForMe: null, // A promise which, if available, the Service will wait for it to resolve before starting the updater.
* broadcastEvent: null, // The name of an event to broadcast on $rootScope when an update is available.
* listenForEvent: null, // The name of an event to listen for on the base directive and trigger an update.
* functionParams: [], // An array that will become the passedFunction's parameters.  Only supports numerically-indexed parameters like functionParams[1].  Trying functionParams["foo"] will not work.
* loadingClass: 'fa fa-spinner fa-spin', // The default loading spinner icon.

## Logging
This module uses $log.debug throughout.  If you want to see the logging output, set $logProvider.debugEnabled(true).

Most logging output will just give you a sense of what functions fire and when.