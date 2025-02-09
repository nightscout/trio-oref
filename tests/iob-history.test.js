'use strict';

require('should');

describe('splitAroundSuspends', function() {
    const { splitAroundSuspends } = require('../lib/iob/history');

    it('should handle event fully within suspended period', function() {
        const currentEvent = {
            started_at: new Date('2024-02-08T10:15:00'),
            duration: 30,
            date: new Date('2024-02-08T10:15:00').getTime()
        };

        const pumpSuspends = [];
        const firstResumeTime = new Date('2024-02-08T10:45:00');
        const suspendedPrior = true;
        const lastSuspendTime = new Date('2024-02-08T09:00:00');
        const currentlySuspended = false;

        const result = splitAroundSuspends(currentEvent, pumpSuspends, firstResumeTime, suspendedPrior, lastSuspendTime, currentlySuspended);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].duration.should.equal(0);
    });

    it('should handle event partially overlapping prior suspend', function() {
        const currentEvent = {
            started_at: new Date('2024-02-08T10:30:00'),
            duration: 60,
            date: new Date('2024-02-08T10:30:00').getTime()
        };

        const pumpSuspends = [];
        const firstResumeTime = new Date('2024-02-08T10:45:00');
        const suspendedPrior = true;
        const lastSuspendTime = new Date('2024-02-08T09:00:00');
        const currentlySuspended = false;

        const result = splitAroundSuspends(currentEvent, pumpSuspends, firstResumeTime, suspendedPrior, lastSuspendTime, currentlySuspended);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].duration.should.equal(45); // From resume time to end
        result[0].started_at.getTime().should.equal(firstResumeTime.getTime());
    });

    it('should handle event fully within current suspend', function() {
        const currentEvent = {
            started_at: new Date('2024-02-08T11:15:00'),
            duration: 30,
            date: new Date('2024-02-08T11:15:00').getTime()
        };

        const pumpSuspends = [];
        const firstResumeTime = new Date('2024-02-08T10:45:00');
        const suspendedPrior = false;
        const lastSuspendTime = new Date('2024-02-08T11:00:00');
        const currentlySuspended = true;

        const result = splitAroundSuspends(currentEvent, pumpSuspends, firstResumeTime, suspendedPrior, lastSuspendTime, currentlySuspended);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].duration.should.equal(0);
    });

    it('should handle event partially overlapping current suspend', function() {
        const currentEvent = {
            started_at: new Date('2024-02-08T10:45:00'),
            duration: 60,
            date: new Date('2024-02-08T10:45:00').getTime()
        };

        const pumpSuspends = [];
        const firstResumeTime = new Date('2024-02-08T10:00:00');
        const suspendedPrior = false;
        const lastSuspendTime = new Date('2024-02-08T11:15:00');
        const currentlySuspended = true;

        const result = splitAroundSuspends(currentEvent, pumpSuspends, firstResumeTime, suspendedPrior, lastSuspendTime, currentlySuspended);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].duration.should.equal(30);
    });

    it('should handle event overlapping intermediate suspend period', function() {
        const currentEvent = {
            started_at: new Date('2024-02-08T10:00:00'),
            duration: 120,
            date: new Date('2024-02-08T10:00:00').getTime()
        };

        const pumpSuspends = [{
            started_at: new Date('2024-02-08T10:30:00'),
            duration: 30,
            date: new Date('2024-02-08T10:30:00').getTime()
        }];
        const firstResumeTime = new Date('2024-02-08T09:00:00');
        const suspendedPrior = false;
        const lastSuspendTime = new Date('2024-02-08T12:00:00');
        const currentlySuspended = false;

        const result = splitAroundSuspends(currentEvent, pumpSuspends, firstResumeTime, suspendedPrior, lastSuspendTime, currentlySuspended);
        result.should.be.an.Array();
        result.should.have.length(2);
        result[0].duration.should.equal(30); // First segment before suspend
        result[1].duration.should.equal(60); // Second segment after suspend
        result[1].started_at.getTime().should.equal(new Date('2024-02-08T11:00:00').getTime());
    });

    it('should handle event starting during suspend period', function() {
        const currentEvent = {
            started_at: new Date('2024-02-08T10:45:00'),
            duration: 60,
            date: new Date('2024-02-08T10:45:00').getTime()
        };

        const pumpSuspends = [{
            started_at: new Date('2024-02-08T10:30:00'),
            duration: 45,
            date: new Date('2024-02-08T10:30:00').getTime()
        }];
        const firstResumeTime = new Date('2024-02-08T09:00:00');
        const suspendedPrior = false;
        const lastSuspendTime = new Date('2024-02-08T12:00:00');
        const currentlySuspended = false;

        const result = splitAroundSuspends(currentEvent, pumpSuspends, firstResumeTime, suspendedPrior, lastSuspendTime, currentlySuspended);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].duration.should.equal(30); // Remaining time after suspend ends
        result[0].started_at.getTime().should.equal(new Date('2024-02-08T11:15:00').getTime());
    });

    it('should handle multiple suspend periods', function() {
        const currentEvent = {
            started_at: new Date('2024-02-08T10:00:00'),
            duration: 180,
            date: new Date('2024-02-08T10:00:00').getTime()
        };

        const pumpSuspends = [
            {
                started_at: new Date('2024-02-08T10:30:00'),
                duration: 30,
                date: new Date('2024-02-08T10:30:00').getTime()
            },
            {
                started_at: new Date('2024-02-08T11:30:00'),
                duration: 30,
                date: new Date('2024-02-08T11:30:00').getTime()
            }
        ];
        const firstResumeTime = new Date('2024-02-08T09:00:00');
        const suspendedPrior = false;
        const lastSuspendTime = new Date('2024-02-08T13:00:00');
        const currentlySuspended = false;

        const result = splitAroundSuspends(currentEvent, pumpSuspends, firstResumeTime, suspendedPrior, lastSuspendTime, currentlySuspended);
        result.should.be.an.Array();
        result.should.have.length(3);
        result[0].duration.should.equal(30); // First segment
        result[1].duration.should.equal(30); // Middle segment
        result[2].duration.should.equal(60); // Last segment
    });
});
