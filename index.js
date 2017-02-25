/**
 * NOS EPG 
 * Claudio Gamboa <gamboa AT_NO_SPAM pdvel.com
 */

const request = require('request');
const fs = require('fs');
const path = require('path');

const jsdom = require('jsdom');

const moment = require('moment');

const epg = require('./config');


const apiURL = 'http://www.nos.pt/_layouts/15/Armstrong/ApplicationPages/EPGGetProgramsAndDetails.aspx/GetProgramsForChannels';

const findChannel = (code) => {
    let channel = null;
    epg.forEach((item, idx) => {
        if (code === item.nameCode) {
            channel = item;
        }
    });
    return channel;
};

const formatData = (err, data, numDays, callBack) => {
    jsdom.env(data, ['http://code.jquery.com/jquery.js'], (err, window) => {
        if (err) {
            console.log('Error');
            return;
        }
        const aChannels = [];
        window.document.querySelectorAll('.channel').forEach((chan, idx) => {
            const channelInfo = findChannel(chan.id);

            const channel = {
                id: chan.id,
                position: (channelInfo) ? channelInfo.num : null,
                name: (channelInfo) ? channelInfo.name : null,
                programs: []
            };
            chan.querySelectorAll('li.programClass').forEach((item, idx2) => {

                const program = item.querySelector('a[title]').getAttribute('title');
                const aHour = item.querySelector('span.duration').textContent.split(' - ');
                let startTS = Number(moment(aHour[0], 'HH:mm').format('x'));
                let endTS = Number(moment(aHour[1], 'HH:mm').format('x'));

                const diffStart = endTS - startTS;
                if (diffStart < 0) {
                    startTS = startTS - (60 * 60 * 24 * 1000);
                }
                const diffEnd = endTS - startTS;

                if (diffEnd < 0) {
                    endTS = endTS + (60 * 60 * 24 * 1000);
                }

                startTS = startTS + ((60 * 60 * 24 * 1000) * numDays);
                endTS = endTS + ((60 * 60 * 24 * 1000) * numDays);

                channel.programs.push({
                    name: program,
                    startStr: aHour[0],
                    start: moment(startTS).format('YYYY-MM-DD HH:mm'),
                    startTS: startTS, 
                    endStr: aHour[1],
                    end: moment(endTS).format('YYYY-MM-DD HH:mm'),
                    endTS: endTS
                });                
            });
            aChannels.push(channel);
        });

        saveCache(numDays, JSON.stringify(aChannels, null, 2));

        callBack(null, aChannels);
    });
};

const cacheId = (numDays) => {
    const curDate = moment().format('YYYY-MM-DD');
    const fileName = curDate + '_' + numDays + '.json';

    const filePath = path.join(__dirname, 'cache', fileName);

    return filePath;
};


const getCache = (numDays) => {
    const cacheFilePath = cacheId(numDays);

    try {
        const stats = fs.statSync(cacheFilePath);
        
        return fs.readFileSync(cacheFilePath, 'utf8');
    } catch (e) {
        return null;
    }
}

const saveCache = (numDays, data) => {
    const cacheFilePath = cacheId(numDays);
    try {
        fs.writeFileSync(cacheFilePath, data, 'utf8');
        return true;
    } catch (e) {
        return false;
    }
};

const getData = (numDays, callBack, callBackForNoCache) => {

    const cacheData = getCache(numDays);
    if (cacheData !== null) {
        const aChannels = JSON.parse(cacheData);
        callBack(null, aChannels);
    } else {

        callBackForNoCache();

        // 
        // curl -X POST 'http://www.nos.pt/_layouts/15/Armstrong/ApplicationPages/EPGGetProgramsAndDetails.aspx/GetProgramsForChannels' -d "{'channelStartIndex':'1','day':'0','order':'grelha','category':'','numChannels':'1'}" -H 'X-Requested-With: XMLHttpRequest' -H 'Content-type: application/json'
        //
        var options = {
            uri: apiURL,
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            json: {'channelStartIndex':'0','day':numDays+'','order':'grelha','category':'','numChannels':'250'}
        };

        request(options, function(err, response, body) {
            if (err) {
                callBack(err);
                return;
            }
            if (response.statusCode == 200) {
                const oBody = body;

                formatData(null, oBody.d, numDays, callBack);
            }
        });
    }
};

module.exports = getData;
