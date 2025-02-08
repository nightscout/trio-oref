'use strict';

require('should');

describe('splitTimespanWithOneSplitter', function() {
    const { splitTimespanWithOneSplitter } = require('../lib/iob/history');

    it('should not split event if duration is less than 30 min and does not cross splitter time', function() {
        const event = {
            started_at: new Date('2024-02-08T10:00:00'),
            duration: 20
        };

        const splitter = {
            type: 'recurring',
            minutes: 660  // 11:00
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
	console.log(result);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].should.equal(event);
    });

    it('should split event if duration is greater than 30 min', function() {
        const event = {
            started_at: new Date('2024-02-08T10:00:00'),
            duration: 60
        };

        const splitter = {
            type: 'recurring',
            minutes: 660  // 11:00
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
        result.should.be.an.Array();
        result.should.have.length(2);
        result[0].duration.should.equal(30);
        result[1].duration.should.equal(30);
        
        // Verify second event starts 30 minutes after first
        const expectedStartTime = new Date(event.started_at.getTime() + 30 * 60 * 1000);
        result[1].started_at.getTime().should.equal(expectedStartTime.getTime());
    });

    it('should split event if it crosses splitter time', function() {
        const event = {
            started_at: new Date('2024-02-08T10:45:00'),  // 645 minutes
            duration: 25
        };

        const splitter = {
            type: 'recurring',
            minutes: 660  // 11:00
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
        result.should.be.an.Array();
        result.should.have.length(2);
        
        // First event should run until splitter time
        const minutesToSplitter = splitter.minutes - (event.started_at.getHours() * 60 + event.started_at.getMinutes());
        result[0].duration.should.equal(minutesToSplitter);  // From 10:45 to 11:00 = 15 minutes
        result[1].duration.should.equal(event.duration - minutesToSplitter);  // Remaining 10 minutes
        
        // Verify second event starts at splitter time
        const splitTime = new Date('2024-02-08T11:00:00');
        result[1].started_at.getTime().should.equal(splitTime.getTime());
    });

    it('should handle both duration > 30 and crossing splitter time', function() {
        const event = {
            started_at: new Date('2024-02-08T10:45:00'),  // 645 minutes
            duration: 45
        };

        const splitter = {
            type: 'recurring',
            minutes: 660  // 11:00
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
        result.should.be.an.Array();
        result.should.have.length(2);
        result[0].duration.should.equal(30);  // Split at 30 minutes due to max duration
        result[1].duration.should.equal(15);  // Remaining 15 minutes
    });

    it('should handle event crossing midnight', function() {
        const event = {
            started_at: new Date('2024-02-08T23:45:00'),  // 1425 minutes
            duration: 25
        };

        const splitter = {
            type: 'recurring',
            minutes: 0  // Midnight
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
        result.should.be.an.Array();
        result.should.have.length(2);
        result[0].duration.should.equal(15);  // Until midnight
        result[1].duration.should.equal(10);  // After midnight
        
        // Verify second event starts at midnight
        const midnightTime = new Date('2024-02-09T00:00:00');
        result[1].started_at.getTime().should.equal(midnightTime.getTime());
    });

    it('should not split event if splitter type is not recurring', function() {
        const event = {
            started_at: new Date('2024-02-08T10:45:00'),
            duration: 45
        };

        const splitter = {
            type: 'non-recurring',
            minutes: 660
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].should.equal(event);
    });

    it('should handle undefined duration', function() {
        const event = {
            started_at: new Date('2024-02-08T10:45:00'),
            rate: 2.0
        };

        const splitter = {
            type: 'recurring',
            minutes: 660  // 11:00
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].should.equal(event);
    });

    it('should handle zero duration', function() {
        const event = {
            started_at: new Date('2024-02-08T10:45:00'),
            duration: 0,
            rate: 2.0
        };

        const splitter = {
            type: 'recurring',
            minutes: 660  // 11:00
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
        result.should.be.an.Array();
        result.should.have.length(1);
        result[0].should.equal(event);
    });
    
    it('should preserve all properties in split events', function() {
        const event = {
            started_at: new Date('2024-02-08T10:45:00'),
            duration: 25,
            rate: 2.0,
            temp: 'absolute',
            timestamp: '2024-02-08T10:45:00'
        };

        const splitter = {
            type: 'recurring',
            minutes: 660  // 11:00
        };

        const result = splitTimespanWithOneSplitter(event, splitter);
        result.should.be.an.Array();
        result.should.have.length(2);
        
        // Both events should keep original properties except duration and timestamps
        result[0].rate.should.equal(event.rate);
        result[0].temp.should.equal(event.temp);
        result[1].rate.should.equal(event.rate);
        result[1].temp.should.equal(event.temp);
        
        // First event keeps original timestamp
        result[0].timestamp.should.equal(event.timestamp);
        
        // Second event gets updated timestamp and date
        const splitTime = new Date('2024-02-08T11:00:00');
        result[1].started_at.getTime().should.equal(splitTime.getTime());
        result[1].date.should.equal(splitTime.getTime());
    });
});

describe('splitTimespan', function() {
    const { splitTimespan } = require('../lib/iob/history');

    it('should not split an event when no splitter moments match', function() {
        // Create a 30 min temp basal from 1:00 to 1:30
        const event = {
            duration: 30,
            started_at: new Date('2024-02-08T01:00:00'),
            date: new Date('2024-02-08T01:00:00').getTime()
        };

        // Create splitter at 2:00, which is after the event
        const splitterMoments = [{
            type: 'recurring',
            minutes: 120 // 2:00
        }];

        const result = splitTimespan(event, splitterMoments);
        result.length.should.equal(1);
        result[0].should.deepEqual(event);
    });

    it('should split an event that overlaps with a splitter moment', function() {
        // Create a 60 min temp basal from 1:30 to 2:30
        const event = {
            duration: 60,
            started_at: new Date('2024-02-08T01:30:00'),
            date: new Date('2024-02-08T01:30:00').getTime()
        };

        // Create splitter at 2:00
        const splitterMoments = [{
            type: 'recurring',
            minutes: 120 // 2:00
        }];

        const result = splitTimespan(event, splitterMoments);
        result.length.should.equal(2);
        
        // First segment should be 30 mins (1:30-2:00)
        result[0].duration.should.equal(30);
        result[0].started_at.should.deepEqual(new Date('2024-02-08T01:30:00'));
        
        // Second segment should be 30 mins (2:00-2:30)
        result[1].duration.should.equal(30);
        result[1].started_at.should.deepEqual(new Date('2024-02-08T02:00:00'));
    });

    it('should split events longer than 30 minutes into 30 minute segments', function() {
        // Create a 90 min temp basal
        const event = {
            duration: 90,
            started_at: new Date('2024-02-08T01:00:00'),
            date: new Date('2024-02-08T01:00:00').getTime()
        };

        // No relevant splitter moments
        const splitterMoments = [{
            type: 'recurring',
            minutes: 240 // 4:00, well after event
        }];

        const result = splitTimespan(event, splitterMoments);
        result.length.should.equal(3);
        
        // Should be split into three segments: 30, 30, and 30 minutes
        result[0].duration.should.equal(30);
        result[1].duration.should.equal(30);
        result[2].duration.should.equal(30);
        
        result[0].started_at.should.deepEqual(new Date('2024-02-08T01:00:00'));
        result[1].started_at.should.deepEqual(new Date('2024-02-08T01:30:00'));
        result[2].started_at.should.deepEqual(new Date('2024-02-08T02:00:00'));
    });

    it('should handle events that span midnight', function() {
        // Create event that goes from 23:30 to 00:30
        const event = {
            duration: 60,
            started_at: new Date('2024-02-08T23:30:00'),
            date: new Date('2024-02-08T23:30:00').getTime()
        };

        // Splitter at midnight (0 minutes)
        const splitterMoments = [{
            type: 'recurring',
            minutes: 0
        }];

        const result = splitTimespan(event, splitterMoments);
        result.length.should.equal(2);
        
        // First segment should be 30 mins (23:30-00:00)
        result[0].duration.should.equal(30);
        result[0].started_at.should.deepEqual(new Date('2024-02-08T23:30:00'));
        
        // Second segment should be 30 mins (00:00-00:30)
        result[1].duration.should.equal(30);
        result[1].started_at.should.deepEqual(new Date('2024-02-09T00:00:00'));
    });

    it('should handle multiple splitter moments', function() {
        // Create a 120 min temp basal from 1:00 to 3:00
        const event = {
            duration: 120,
            started_at: new Date('2024-02-08T01:00:00'),
            date: new Date('2024-02-08T01:00:00').getTime()
        };

        // Create splitters at 1:30 and 2:00
        const splitterMoments = [
            {
                type: 'recurring',
                minutes: 90  // 1:30
            },
            {
                type: 'recurring',
                minutes: 120 // 2:00
            }
        ];

        const result = splitTimespan(event, splitterMoments);
        result.length.should.equal(4); // Split into 4 30-minute segments
        
        result[0].duration.should.equal(30);
        result[1].duration.should.equal(30);
        result[2].duration.should.equal(30);
        result[3].duration.should.equal(30);
        
        result[0].started_at.should.deepEqual(new Date('2024-02-08T01:00:00'));
        result[1].started_at.should.deepEqual(new Date('2024-02-08T01:30:00'));
        result[2].started_at.should.deepEqual(new Date('2024-02-08T02:00:00'));
        result[3].started_at.should.deepEqual(new Date('2024-02-08T02:30:00'));
    });
});

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
