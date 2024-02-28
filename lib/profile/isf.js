'use strict';

var _ = require('lodash');

function isfLookup(isf_data, timestamp) {

    var nowDate = timestamp;

    if (typeof(timestamp) === 'undefined') {
        nowDate = new Date();
    }

    var nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();

    isf_data = _.sortBy(isf_data.sensitivities, function(o) { return o.offset; });

    var isfSchedule = isf_data[isf_data.length - 1];

    if (isf_data[0].offset !== 0) {
        return -1;
    }

    var endMinutes = 1440;

    for (var i = 0; i < isf_data.length - 1; i++) {
        var currentISF = isf_data[i];
        var nextISF = isf_data[i+1];
        if (nowMinutes >= currentISF.offset && nowMinutes < nextISF.offset) {
            endMinutes = nextISF.offset;
            isfSchedule = isf_data[i];
            break;
        }
    }

    return isfSchedule.sensitivity;
}

isfLookup.isfLookup = isfLookup;
exports = module.exports = isfLookup;
