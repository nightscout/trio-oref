'use strict';

require('should');
const moment = require('moment');
const calcTempTreatments = require('../lib/iob/history');

describe('Suspend Logic Tests with suspendZerosIob=true', function() {
    // Helper function to create a basic basal profile
    function createBasicBasalProfile() {
        return [{
            'start': '00:00:00',
            'rate': 1,
            'minutes': 0
        }];
    }

    // Helper function to create a multi-rate basal profile
    function createMultiRateBasalProfile() {
        return [{
            'start': '00:00:00',
            'rate': 1,
            'minutes': 0
        }, {
            'start': '00:30:00',
            'rate': 2,
            'minutes': 30
        }];
    }

    it('should handle suspend with basal profile changes', function() {
        const basalprofile = createMultiRateBasalProfile();
        
        // Start at 00:15, suspend at 00:30, resume at 00:45
        const startTime = moment('2016-06-13 00:15:00').toDate();
        const suspendTime = moment('2016-06-13 00:30:00').toDate();
        const resumeTime = moment('2016-06-13 00:45:00').toDate();
        const endTime = moment('2016-06-13 01:00:00').toDate();

        const inputs = {
            clock: endTime.toISOString(),
            history: [
                {
                    _type: 'TempBasal',
                    rate: 3,
                    date: startTime.getTime(),
                    timestamp: startTime.toISOString()
                },
                {
                    _type: 'TempBasalDuration',
                    'duration (min)': 45,
                    date: startTime.getTime(),
                    timestamp: startTime.toISOString()
                },
                {
                    _type: 'PumpSuspend',
                    date: suspendTime.getTime(),
                    timestamp: suspendTime.toISOString()
                },
                {
                    _type: 'PumpResume',
                    date: resumeTime.getTime(),
                    timestamp: resumeTime.toISOString()
                }
            ].reverse(),
            profile: {
                current_basal: 1,
                max_daily_basal: 2,
                dia: 3,
                basalprofile: basalprofile,
                suspend_zeros_iob: true
            }
        };

        const treatments = calcTempTreatments(inputs);

        // Calculate expected insulin impact:
        // 15m at 3 U/h - 1 U/h = 0.5U (from start to basal change)
        // 15m at 0 U/h - 2 U/h = -0.5U (from basal change and suspend)
        // 15m at 3 U/h - 2 U/h = 0.25U (resume to finish)
        // Total: 0.25U
        const tempBoluses = treatments.filter(t => t.insulin !== undefined);
        const totalInsulin = tempBoluses.reduce((sum, bolus) => sum + bolus.insulin, 0);
        totalInsulin.should.be.approximately(0.25, 0.05);
    });

    it('should handle suspend without basal profile changes', function() {
        const basalprofile = createMultiRateBasalProfile();
        
        // Start at 00:30, suspend at 00:45, resume at 01:00
        const startTime = moment('2016-06-13 00:30:00').toDate();
        const suspendTime = moment('2016-06-13 00:45:00').toDate();
        const resumeTime = moment('2016-06-13 01:00:00').toDate();
        const endTime = moment('2016-06-13 01:15:00').toDate();

        const inputs = {
            clock: endTime.toISOString(),
            history: [
                {
                    _type: 'TempBasal',
                    rate: 3,
                    date: startTime.getTime(),
                    timestamp: startTime.toISOString()
                },
                {
                    _type: 'TempBasalDuration',
                    'duration (min)': 45,
                    date: startTime.getTime(),
                    timestamp: startTime.toISOString()
                },
                {
                    _type: 'PumpSuspend',
                    date: suspendTime.getTime(),
                    timestamp: suspendTime.toISOString()
                },
                {
                    _type: 'PumpResume',
                    date: resumeTime.getTime(),
                    timestamp: resumeTime.toISOString()
                }
            ].reverse(),
            profile: {
                current_basal: 1,
                max_daily_basal: 2,
                dia: 3,
                basalprofile: basalprofile,
                suspend_zeros_iob: true
            }
        };

        const treatments = calcTempTreatments(inputs);

        // Calculate expected insulin impact:
        // 15m at 3 U/h - 2 U/h = 0.25U (from start to suspend)
        // 15m at 0 U/h - 2 U/h = -0.5U (from suspend to resume)
        // 15m at 3 U/h - 2 U/h = 0.25U (resume to finish)
        // Total: 0U
        const tempBoluses = treatments.filter(t => t.insulin !== undefined);
        const totalInsulin = tempBoluses.reduce((sum, bolus) => sum + bolus.insulin, 0);
        totalInsulin.should.be.approximately(0.0, 0.05);
    });
});
