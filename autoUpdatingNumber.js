angular.module('app')

// generic auto updating number helper directive.  not usable on its own
// passedFunction: a function that returns a promise of a number
// config: an Array with indexed arguments to your passedFunction.  
// config has an optional named param, 'time', that sets the run interval
// autoStart: (default true) whether to automatically start calling passedFunction

.directive('autoUpdatingNumber', function($filter, $interval, $timeout, $rootScope) {
	return {
		scope: {
			passedFunction: '=', // normally you would use '&' for functions but the way this is used you need '='
			config: '=',
			loadingClass: '@',
			autoStart: '=?'
		},
		restrict: 'E',
		template: '<span><span ng-class="{ \'{{ loadingClass }}\': text==null }"></span>' +
			'<span ng-if="text != null" title="{{ title }}">{{ text }}</span></span>',
		controller: function($scope) {
			var existingInterval; // a record of what we've created so we can cancel it later
			var defaultWaitTime = 10000; // default wait time in ms
			var failures = 0; // number of consecutive failures to get the passedFunction

			$scope.text; // text to be displayed by the directive
			$scope.title = "Loading"; // html title text

			var that = this; // js trick to keep track of the scope in this context

			// an exposed function to start the process
			this.start = function(passedFunction, config) {
				if(config.time == null) {
					config.time = defaultWaitTime;
				}

				// if you call start more than once, cancel the existing timer created by this directive
				if(existingInterval != null) {
					$interval.cancel(existingInterval);
				}

				// add the passedFunction to the config in an Array as part of the Rest Parameters workaround
				var passedVars = [passedFunction].concat(config);
				// first run
				update.apply(that, passedVars);

				// schedule an interval to update on
				existingInterval = $interval(function() {
					update.apply(that, passedVars);
				}, config.time);

				// cancels the interval during the angular $destroy event when the DOM element is removed
				$scope.on("$destroy", function(event) {
					$interval.cancel(existingInterval)
				});
			};

			// stops further execution
			this.stop = function() {
				if(existingInterval != null) {
					$interval.cancel(existingInterval);
				}
			};

			// stops further execution with failure
			this.fail = function() {
				if(existingInterval != null) {
					if($scope.text == null) {
						$scope.text = "?";
						$scope.title = "Could not contact database.";
					}
					that.stop();
				}
			};

			// runs the passedFunction and binds the result to scope
			// should be declared as a Rest Parameter (passedFunction, ...config) (not related to REST calls), 
			// but chose not to because PhantomJS (which Jasmine uses) doesn't yet support it
			var update = function(passedFunction) {
				// Rest Parameter workaround
				// uses the Javascript build in implicit arguments parameter to build the array of Rest Parameters

				var restParams = [];

				for(var i = 0; i < arguments.length; i++) {
					// ignores the first param, which is the passedFunction
					if(i > 0) { restParams.push(arguments[i]); }
				}

				passedFunction.apply(that, restParams).then(function(results) {
					failures = 0; // reset consecutive failure counter on success callback

					try {
						var num = Number(results);	
						if(num != null) {
							// timeout here to make a smoother application of the text
							$timeout(function() {
								$scope.text = num;
								$scope.title = "";
							});
						}
					}
					catch(e) {
						// error stuff, probably a NaN problem
					}
					
				}, function() {
					// failed to get http call
					failures++; // increment consecutive failure counter

					if(failures >= 2) {
						that.fail(); // officially give up
					}
				});
			}

			// start the process unless told not to
			if($scope.autoStart == null || $scope.autoStart == true) {
				this.start($scope.passedFunction, $scope.config);
			}
		}
	};
})

// implementation example for auto-updating-number
// use like: <my-number-display />
.directive('myNumberDisplay', function(MyService, myVariable) {
	return {
		restrict: 'E',
		template: '<auto-updating-number passed-function="passedFunction" config="config" />',
		controller: function($scope) {
			// the function that will be run by the autoUpdatingNumber directive
			$scope.passedFunction = MyService.get();
			// parameters for the passedFunction
			$scope.config = [myVariable];
		}
	};
})