'use strict';

require('should');

describe('splitAroundSuspends', function() {
    const { splitAroundSuspends } = require('../lib/iob/history');

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
});
