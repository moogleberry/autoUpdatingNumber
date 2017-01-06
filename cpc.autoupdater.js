/* 
	Manager service for all things that have to automatically update with REST calls.

	Dependencies: 
		1) Angular.js 1.x
		2) Font-Awesome (used only in the base auto-updating-directive's template)

	Basic usage:
		1) Register an updater
		2) It will run on its own

	To register an updater you need:
		1) updaterFunction (required):
			The function that will be run for you in an $interval
			This function must either return a promise, or the data you want to display
		2) updaterName (optional): 
			The unique key by which this updater will be known to the Service.
			You can provide this yourself, or the Service will generate a random one for you.
			You can call the updater later if you have this key.
		3) updaterConfig (optional):
			A configuration object for the updater. 
			If you need to pass variabled into your updaterFunction, put them in the updaterConfig.functionParams array.
			See the DEFAULTS object for details on each configuration option.

	Logs: 
		This module uses $log.debug throughout.  If you want to see the logging output, set $logProvider.debugEnabled(true).
		Most logging output will just give you a sense of what functions fire and when.

	Version 1.0
*/

angular.module('cpc.autoupdater', []).service('AutoUpdater', AutoUpdater);
AutoUpdater.$inject = ['$interval', '$timeout', '$q', '$rootScope', '$log'];
function AutoUpdater($interval, $timeout, $q, $rootScope, $log) {
	var that = this;

	var DEFAULTS = {
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
	};

	// All the updaters currently registered with the Service.
	var registeredUpdaters = {};

	/*
		Registers a new updater.
		If no updaterFunction is provided, this does nothing.
		If no updaterName is provided, creates a random one.
		If no updaterConfig is provided, uses all default values (see DEFAULTS object).
		Returns the updaterName on success.  Returns null on failure.
	*/
	this.registerUpdater = function(updaterFunction, updaterName, updaterConfig) {
		$log.debug("AutoUpdater: registerUpdater: ", updaterFunction, updaterName, updaterConfig);

		// Check for undefined updater name and fill with random value
		if(!updaterName) {
			updaterName = "updater" + Math.random().toString();
		}

		updaterConfig = _compileConfig(updaterConfig);

		if(updaterFunction) {
			registeredUpdaters[updaterName] = {
				name: updaterName,
				updater: updaterFunction,
				config: updaterConfig,
				failures: 0,
				value: null,
				title: "Loading"
			};

			// If told not to, do NOT start updater.
			if(registeredUpdaters[updaterName].config.autoStart === false) {
				return updaterName;
			}
			// Otherwise, start updater (default)
			else {
				that.startUpdater(updaterName);
				return updaterName;
			}
		}
		else {
			return null;
		}
	};

	/* 
		Returns the updater object.
		Useful if you need to do something with the object that the API doesn't support.
	*/
	this.getUpdater = function(updaterName) {
		$log.debug("AutoUpdater: getUpdater: ", updaterName);
		return registeredUpdaters[updaterName];
	};

	/*
		Returns the object of all updaters.
		You probably shouldn't use this over getUpdater unless you really need ALL the updaters
	*/
	this.getAllUpdaters = function() {
		$log.debug("AutoUpdater: getAllUpdaters");
		return registeredUpdaters;
	};

	/*
		Getter for the DEFAULTS object.  Mostly for testing/confirmation.
	*/
	this.getDefaults = function() {
		return DEFAULTS;
	};

	/*
		Setter for DEFAULTS object.
		Extends the DEFAULTS object with your config object. 
		Use this if you need to set all updaters a certain way.
		Pass in a config object on updater registry if you only need to set one updater a certain way.
		Returns new DEFAULTS object.
	*/
	this.setDefaults = function(config) {
		return angular.extent(DEFAULTS, config);
	};

	/*
		Compiles a config object from DEFAULTS and passed overrides.
		Does not change the global CONFIG object.
		Returns a new config object.
	*/
	function _compileConfig(config) {
		return angular.extend({}, DEFAULTS, config);
	};

	/*
		Updates the config object for an existing updater.
		Returns new config object on success.
		Returns false if it could not find the updater.
		If the updater is already running, foring an update() will apply all new configs.
	*/
	this.modifyConfig = function(updaterName, config) {
		$log.debug("AutoUpdater: modifyConfig: ", updaterName, config);

		if(registeredUpdaters[updaterName]) {
			angular.extend(registeredUpdaters[updaterName].config, config);
			return registeredUpdaters[updaterName].config;
		}
		else  {
			return false;
		}
	};

	/*
		Runs an updater if it is not already started.
		If the updater is already started, this does nothing.
		Checks the refreshTimer variable and defaults it if necessary, then starts an $interval.
		Will wait for the waitForMe promise to resolve before starting, if it is available.
		Returns true if it started the updater, or if it was already started, or is waiting for waitForMe.
		Returns false if it could not find the updater.
	*/
	this.startUpdater = function(updaterName) {
		$log.debug("AutoUpdater: startUpdater: ", updaterName);

		if(registeredUpdaters[updaterName]) {
			// If the interval for this updater exists, do nothing, if not, run it
			if(!registeredUpdaters[updaterName].interval) {
				// Check for the waitForMe promise before running the update
				if(registeredUpdaters[updaterName].config.waitForMe) {
					$q.when(registeredUpdaters[updaterName].config.waitForMe).then(function() {
						that.updater(updaterName);
					});
				}
				else {
					that.updater(updaterName);
				}
			}

			return true;
		}
		else {
			return false;
		}
	};

	/*
		If an $interval has not been created for this updater, create one.
		This can be called to force an update right now with the forceUpdate flag.
	*/
	this.update = function(updaterName, forceUpdate) {
		$log.debug("AutoUpdater: update: ", updaterName, forceUpdate);

		if(registeredUpdaters[updaterName]) {

			// Allows for this.update to force an update right now
			if(forceUpdate) {
				if(registeredUpdaters[updaterName].interval) {
					// Cancel the interval
					that.stopUpdater(updaterName);
					// Restart the updater.  This will make the call immediately.
					_createUpdater(updaterName);
					// Run an update now.
					_update(updaterName);
				}
			}

			// Create the updater if it does not exist and run it
			if(!registeredUpdaters[updaterName].interval) {
				_createUpdater(updaterName);
				_update(updaterName);
			}
		}
		else {
			// Updater name does not exist
			return false;
		}
	};

	/*
		Create the $interval that causes automatic updates to happen
	*/
	function _createUpdater(updaterName) {
		$log.debug("AutoUpdater: _createUpdater: ", updaterName);

		if(registeredUpdaters[updaterName].config.refreshTimer) {
			registeredUpdaters[updaterName].interval = $interval(function() {
				_update(updaterName);
			}, registeredUpdaters[updaterName].config.refreshTimer);
		}
	}

	/*
		Runs the updater using function.apply.
	*/
	function _update(updaterName) {
		// This is wrapped in $q.when in case the function is not a promise, to support static values
		return $q.when(registeredUpdaters[updaterName].updater.apply(that, registeredUpdaters[updaterName].config.functionParams)).then(function(response) {
			// http success case
			$log.debug("AutoUpdater: update success: ", updaterName, response);

			// Use existence checks for all updater references bycause the call is asynchronous
			// The updater may have been deregistered in the meantime, which would cause an error
			if(registeredUpdaters[updaterName]) {
				registeredUpdaters[updaterName].failures = 0; // reset consecutive failure counter
			}

			// If set to broadcast updates, do so
			if(registeredUpdaters[updaterName].config.broadcastEvent) {
				$rootScope.$broadcast(registeredUpdaters[updaterName].config.broadcastEvent);
			}

			// Apply the update
			if(response !== null && !angular.isUndefined(response)) {
				// This timeout gives a smoother application of the text
				// Without, the reaction lag of a font-awesome spinner is very noticable
				$timeout(function() {
					if(registeredUpdaters[updaterName]) {
						registeredUpdaters[updaterName].value = response;
						registeredUpdaters[updaterName].title = '';
					}
				});
			}
		}, function(error) {
			// http error case
			$log.debug("AutoUpdater: update failed: ", updaterName, error);

			if(registeredUpdaters[updaterName]) {
				// Increment consecutive failure counter to avoid failing forever
				registeredUpdaters[updaterName].failures++;

				if(registeredUpdaters[updaterName].config.maxFailures !== registeredUpdaters[updaterName].config.maxFailuresMagicNumber && 
					registeredUpdaters[updaterName].failures >= registeredUpdaters[updaterName].config.maxFailures) {
					// Officially give up after x times
					that.failUpdater(updaterName);
				}
			}
		});
	}

	/*
		Stops an updater from running by cancelling its interval.
		Returns true if the updater was found and was running, false if not.
	*/
	this.stopUpdater = function(updaterName) {
		$log.debug("AutoUpdater: stopUpdater: ", updaterName);

		if(registeredUpdaters[updaterName] &&
			registeredUpdaters[updaterName].interval !== null) {

			$interval.cancel(registeredUpdaters[updaterName].interval);
			return true;
		}
		else {
			return false;
		}
	};

	/*
		Stops an updater from running any more and visually shows its failure.
	*/
	this.failUpdater = function(updaterName) {
		$log.debug("AutoUpdater: failUpdater: ", updaterName);

		if(registeredUpdaters[updaterName]) {
			// Cancels the updater's interval if it exists.
			that.stopUpdater(updaterName);
			// Change the updater's text to show failure.
			registeredUpdaters[updaterName].value = registeredUpdaters[updaterName].config.failureText;
			registeredUpdaters[updaterName].title = registeredUpdaters[updaterName].config.failureTitle;

			return true;
		}
		else {
			return false;
		}
	};

	/*
		Deregisters an updater function by key name.
		Also stops the updater.
		Returns true if found, false if not.
	*/
	this.deregisterUpdater = function(updaterName) {
		$log.debug("AutoUpdater: deregisterUpdater: ", updaterName);

		if(registeredUpdaters[updaterName]) {
			// Cancels the updater's interval if it exists
			that.stopUpdater(updaterName);
			// Remove it from the list of updaters
			delete registeredUpdaters[updaterName];

			return true;
		}
		else {
			return false;
		}
	};
}

/*
	Base auto-updating-directive.
	Use this by calling <auto-updating-directive> in your directive's template.
	See the test directive below for a concrete, working example.

	You provide this directive with three things:
	1) updaterFunction (required): A function that returns a value or promise.
		If you use a promise, if must resolve to the data you want to display.
		Note: uses '=' binding, so pass myFunction, not myFunction().
	2) updaterName (optional): A unique name for the updater.
		If not provided, uses the service defaults.
		If a duplicate is entered, subsequent updaters may not behave correctly.
	3) updaterConfig (optional): A config object for the updater.
		If not provided, uses the service defaults.
	All three are described in more detail in the AutoUpdater Service above.
*/
angular.module('cpc.autoupdater').directive('autoUpdatingDirective', autoUpdatingDirective);
autoUpdatingDirective.$inject = ['AutoUpdater'];
function autoUpdatingDirective(AutoUpdater) {
	return {
		scope: {
			updaterFunction: '=',
			updaterName: '=',
			updaterConfig: '='
		},
		restrict: 'E',
		// Template note: I find that this combination of ng-class and ng-if provides the best visual effect
		template: '<span><span ng-class="{\'fa fa-spinner fa-spin\': updater.value === null }"></span>' +
			'<span ng-if="updater.value !== null" title="{{updater.title}}">{{ updater.value }}</span></span>',
		controller: function($scope) {
			// Starts the updater and binds the results to the template
			// Assignment here is needed to support creating updaters without a name.
			$scope.updaterName = AutoUpdater.registerUpdater($scope.updaterFunction, $scope.updaterName, $scope.updaterConfig);
			if($scope.updaterName) {
				$scope.updater = AutoUpdater.getUpdater($scope.updaterName);
			}

			// Attach event listener, if needed
			if($scope.updater && $scope.updater.config.listenForEvent) {
				$scope.$on($scope.updater.config.listenForEvent, function(event) {
					AutoUpdater.update($scope.updaterName);
				});
			}

			// Cancels the interval during the angular $destroy event when the DOM element is removed
			$scope.$on('$destroy', function() {
				AutoUpdater.deregisterUpdater($scope.updaterName);
			});
		}
	};
}

/*
	A test demonstration of the AutoUpdater Service and parent directive
	1) Define a directive for your updater.
	2) Use auto-updating-directive in your directive template where you want your data to go.
	3) Pass in any functions and variables you need to the directive.

	Usage Examples: 
		<auto-updater-test></auto-updater-test>
		<auto-updater-test updater-name="My Test Updater"></auto-updater-test>
*/
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

			// The function that will be run by the auto-updating-directive
			// 
			$scope.passedFunction = test2;

			// Parameters for the updater.
			// If you want to change how the updater works, use the config object.
			// If you need to pass parameters to your updaterFunction, define them here on config.functionParams.
			// If you don't need this, it's ok to not define it.
			$scope.config = {
				functionParams: []
			};
		}
	};
};