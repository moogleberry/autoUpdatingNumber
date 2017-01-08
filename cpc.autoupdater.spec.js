/*
	Jasmine Test Suite for cpc.autoupdater
*/

describe('AutoUpdaterService', function() {
	'use strict'

	var $q, $timeout, $interval, AutoUpdater;

	var testFunction;

	beforeEach(function() {
		module('cpc.autoupdater');
	});

	beforeEach(inject(function($injector) {
		// Inject services we need for tests so they are available on our scope.
		$q = $injector.get("$q");
		$timeout = $injector.get("$timeout");
		$interval = $injector.get("$interval");
		AutoUpdater = $injector.get("AutoUpdater");

		testFunction = function() {
			return $q.resolve("test");
		};
	}));

	describe("registerUpdater(updaterFunction, updaterName, updaterConfig)", function() {
		it("Can register a new updater, and return its name as a String", function() {

		});

		it("Can registera new updater without a nema or config object, and return its name as a String", function() {
			
		});

		it("Sets optional config parameters to the defaults if not present", function() {
			
		});

		it("Does not override optional config parameters if they are present", function() {
			
		});

		it("Can automatically start an updater", function() {
			
		});

		it("Does not automatically start an updater if configured not to", function() {
			
		});
	});

	describe("getUpdater(updaterName)", function() {
		it("Returns the updater object, given an existing updater name", function() {

		});

		it("If the updater was not found, returns undefined", function() {
			
		});
	});

	describe("getAllUpdaters()", function() {
		it("Returns the object of all updaters", function() {

		});
	});

	describe("getDefaults()", function() {
		it("Returns an object with the service default values", function() {

		});
	});

	describe("setDefaults(config)", function() {
		it("Sets the values in the service defaults object, returning a config object", function() {

		});
	});

	describe("modifyConfig(updaterName, config)", function() {
		it("Modifies an updater config object with new values, returning a config object", function() {

		});

		it("If the updater was not found, returns false", function() {

		});
	});

	describe("startUpdater(updaterName)", function() {
		it("Starts the updater via automatic call from registerUpdater, and returns true", function() {

		});

		it("Starts the updater via manual call, and returns true", function() {

		});

		it("If the updater was not found, returns false, and does not call update()", function() {

		});
	});

	describe("update(updaterName, forceUpdate)", function() {
		it("Calls the specified updater function on an interval", function() {

		});

		it("If the updater was not found, returns false", function() {

		});
	});

	describe("stopUpdater(updaterName)", function() {
		it("Stops the updater from calling update() anymore", function() {

		});

		it("If the updater was found, returns true", function() {

		});

		it("If the updater was not found, returns false", function() {

		});
	});

	describe("failUpdater(updaterName)", function() {
		it("Updates the text and title to reflect the failure action", function() {

		});

		it("Calls stopUpdater()", function() {

		});

		it("If the updater was found, returns true", function() {

		});

		it("If the updater was not found, returns false", function() {

		});
	});

	describe("deregisterUpdater(updaterName)", function() {
		it("Removes the updater from the list of updaters", function() {

		});

		it("Calls stopUpdater()", function() {

		});

		it("If the updater was found, returns true", function() {

		});

		it("If the updater was not found, returns false", function() {

		});
	});
});