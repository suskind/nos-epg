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

        callBack(null, aChannels);
    });


    return;

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

        defaultOptions.cacheSet(getCacheId(numDays), JSON.stringify(aChannels, null, 2), callBack);

        
    });
};

const getCacheId = (numDays) => {
    const curDate = moment().format('YYYY-MM-DD');
    return curDate + '_' + numDays;
};

const cachePath = (cacheId) => {
    const fileName = cacheId + '.json';

    const filePath = path.join(__dirname, 'cache', fileName);

    return filePath;
};


const getCache = (cacheId, callBack, runWhenNoCache) => {
    const cacheFilePath = cachePath(cacheId);

    try {
        const stats = fs.statSync(cacheFilePath);
        
        fs.readFile(cacheFilePath, 'utf8', (err, data) => {
            if (err) {
                console.log('ERROR on read cache data');
                callBack(err);
                return;
            }
            callBack(null, JSON.parse(data));
        });
    } catch (e) {
        runWhenNoCache(cacheId, callBack);
    }
}

const saveCache = (cacheId, data, callBack) => {
    const cacheFilePath = cachePath(cacheId);

    fs.writeFile(cacheFilePath, data, 'utf8', (err) => {
        if (err) {
            console.log('Error on save cache');
            callBack(err);
            return;
        }
        callBack(null, JSON.parse(data)); 
    });
};

const defaultCacheType = 'fs';

let defaultOptions = {
    cacheType: defaultCacheType,
    cacheGet: getCache,
    cacheSet: saveCache
};

const getData = (numDays, callBack, callBackForNoCache, options) => {


    // test with no cache

    if (typeof(callBackForNoCache) === 'function') {
        callBackForNoCache();
    }

    var options = {
        uri: apiURL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        json: {'channelStartIndex':'0','day':numDays+'','order':'grelha','category':'','numChannels':'250'}
    };

    request(options, (err, response, body) => {
        if (err) {
            callBack(err);
            return;
        }
        if (response.statusCode == 200) {
            const oBody = body;

            formatData(null, oBody.d, numDays, callBack);
        }
    });




    return;




    defaultOptions = Object.assign(defaultOptions, options);

    const cacheId = getCacheId(numDays);

    defaultOptions.cacheGet(cacheId, (err, data) => {
        if (err) {
            console.log('Error on getCache nos-epg');
            callBack(err);
            return;
        }
        callBack(null, data);
    }, (cacheId, callBack) => {
        if (typeof(callBackForNoCache) === 'function') {
            callBackForNoCache();
        }
        // callBack()
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

        request(options, (err, response, body) => {
            if (err) {
                callBack(err);
                return;
            }
            if (response.statusCode == 200) {
                const oBody = body;

                formatData(null, oBody.d, numDays, callBack);
            }
        });

    });

};

module.exports = getData;
