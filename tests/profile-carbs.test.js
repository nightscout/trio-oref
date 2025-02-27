'use strict';

require('should');
var _ = require('lodash');
var proxyquire = require('proxyquire');

// Create a mock getTime function that matches the actual implementation
// but uses a fixed date (January 26, 2025)
var mockGetTime = function(minutes) {
    var baseTime = new Date(2025, 0, 26, 0, 0, 0); // Jan 26, 2025 midnight
    return baseTime.getTime() + minutes * 60 * 1000; // Return timestamp in milliseconds
};

// Use proxyquire to load the carb_ratios module with our mock
var carb_ratios = proxyquire('../lib/profile/carbs', {
    '../medtronic-clock': mockGetTime
});

describe('Carb Ratio Profile', function() {
    var carbratio_input = {
        units: 'grams',
        schedule: [
            { offset: 0, ratio: 15, start: '00:00:00' },
            { offset: 180, ratio: 18, start: '03:00:00' },
            { offset: 360, ratio: 20, start: '06:00:00' }
        ]
    };

    it('should return current carb ratio from schedule', function() {
        var now = new Date('2025-01-26T02:00:00');
        var ratio = carb_ratios.carbRatioLookup({carbratio: carbratio_input}, null, now);
        ratio.should.equal(15);
    });

    it('should handle ratio schedule changes', function() {
        var now = new Date('2025-01-26T04:00:00');
        var ratio = carb_ratios.carbRatioLookup({carbratio: carbratio_input}, null, now);
        ratio.should.equal(18);
    });

    it('should handle exchanges unit conversion', function() {
        var exchange_input = {
            units: 'exchanges',
            schedule: [
                { offset: 0, ratio: 12, start: '00:00:00' }
            ]
        };
        var now = new Date('2025-01-26T04:00:00');
        var ratio = carb_ratios.carbRatioLookup({carbratio: exchange_input}, null, now);
        ratio.should.equal(1); // 12 grams per exchange
    });

    it('should reject invalid ratios', function() {
        var invalid_input = {
            units: 'grams',
            schedule: [
                { offset: 0, ratio: 2, start: '00:00:00' } // Less than min of 3
            ]
        };
        var ratio = carb_ratios.carbRatioLookup({carbratio: invalid_input});
        should.not.exist(ratio);
    });
});
