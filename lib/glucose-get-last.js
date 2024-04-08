function getDateFromEntry(entry) {
return entry.date || Date.parse(entry.display_time) || Date.parse(entry.dateString);
}

function round(value, digits)
{
    if (! digits) { digits = 0; }
    var scale = Math.pow(10, digits);
    return Math.round(value * scale) / scale;
}

var getLastGlucose = function (data) {
    data = data.filter(function(obj) {
    return obj.glucose || obj.sgv;
    }).map(function prepGlucose (obj) {
        //Support the NS sgv field to avoid having to convert in a custom way
        obj.glucose = obj.glucose || obj.sgv;
        if ( obj.glucose !== null ) {
            return obj;
        }
    });

    var now = data[0];
    var now_date = getDateFromEntry(now);
    var change;
    var last_deltas = [];
    var short_deltas = [];
    var long_deltas = [];
    var avg_deltas = [];
    var last_cal = 0;

    //console.error(now.glucose);
    for (var i=1; i < data.length; i++) {
        // if we come across a cal record, don't process any older SGVs
        if (typeof data[i] !== 'undefined' && data[i].type === "cal") {
            last_cal = i;
            break;
        }
        // only use data from the same device as the most recent BG data point
        if (typeof data[i] !== 'undefined' && data[i].glucose > 38 && data[i].device === now.device) {
            var then = data[i];
            var then_date = getDateFromEntry(then);
            var avgdel = 0;
            var minutesago;
            if (typeof then_date !== 'undefined' && typeof now_date !== 'undefined') {
                minutesago = Math.round( (now_date - then_date) / (1000 * 60) );
                // multiply by 5 to get the same units as delta, i.e. mg/dL/5m
                change = now.glucose - then.glucose;
                avgdel = change/minutesago * 5;
            } else { console.error("Error: date field not found: cannot calculate avgdelta"); }
            //if (i < 5) {
                //console.error(then.glucose, minutesago, avgdelta);
            //}
            // use the average of all data points in the last 2.5m for all further "now" calculations
            avg_deltas.push(avgdel);
            if (-2 < minutesago && minutesago < 2.5) {
                now.glucose = ( now.glucose + then.glucose ) / 2;
                now_date = ( now_date + then_date ) / 2;
                //console.error(then.glucose, now.glucose);
            // short_deltas are calculated from everything ~5-15 minutes ago
            } else if (2.5 < minutesago && minutesago < 17.5) {
                //console.error(minutesago, avgdelta);
                short_deltas.push(avgdel);
                // last_deltas are calculated from everything ~5 minutes ago
                if (2.5 < minutesago && minutesago < 7.5) {
                    last_deltas.push(avgdel);
                }
                //console.error(then.glucose, minutesago, avgdelta, last_deltas, short_deltas);
            // long_deltas are calculated from everything ~20-40 minutes ago
            } else if (17.5 < minutesago && minutesago < 42.5) {
                long_deltas.push(avgdel);
            }
        }
    }
    var delta = 0;
    var shortAvgDelta = 0;
    var longAvgDelta = 0;
    var avgDelta = 0;

    if (short_deltas.length > 0) {
        shortAvgDelta = short_deltas.reduce(function(a, b) { return a + b; }) / short_deltas.length;
    }
    if (last_deltas.length > 0) {
        delta = last_deltas.reduce(function(a, b) { return a + b; }) / last_deltas.length;
    } else {delta = shortAvgDelta}
    if (long_deltas.length > 0) {
        longAvgDelta = long_deltas.reduce(function(a, b) { return a + b; }) / long_deltas.length;
    }
    if (avg_deltas.length > 0) {
        avgDelta = avg_deltas[0]
        console.error("most actual available avgDelta = " + round(avgDelta,2));}

    return {
        glucose: Math.round( now.glucose * 10000 ) / 10000
        , noise: 0  // , noise: Math.round(now.noise) //for now set to nothing as not all CGMs report noise
        , delta: Math.round( delta * 10000 ) / 10000
        , short_avgdelta: Math.round( shortAvgDelta * 10000 ) / 10000
        , long_avgdelta: Math.round( longAvgDelta * 10000 ) / 10000
        , avgdelta: Math.round( avgDelta * 10000 ) / 10000
        , date: now_date
        , last_cal: last_cal
        , device: now.device
    };
};

module.exports = getLastGlucose;
