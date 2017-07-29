import getOptionalStr from './get-optional-string'
import doNotTrackEnabled from './do-not-track-enabled'

(function(window, localStorage, navigator, screen, document, encodeURIComponent) {

    // Check for doNotTrack variable. If it's present, the user has decided to
    // opt-out of the tracking, so we kill this tracking script immediately
    if (doNotTrackEnabled()) {
        return;
    }

    window.addEventListener('load', function() {
        var pageLoadedTimestamp = new Date().getTime();

        window.galite = window.galite || {};
        var req = new XMLHttpRequest();
        var urlBase = (
            'https://www.google-analytics.com/collect?' +
            'cid=' + (localStorage.uid = localStorage.uid || Math.random() + '.' + Math.random()) +
            '&v=1' +
            '&tid=' + galite.UA +
            '&dl=' + encodeURIComponent(document.location.href) +
            '&ul=en-us' +
            '&de=UTF-8'
        );

        var optional = {
            'dt': [document.title],
            'sd': [screen.colorDepth, '-bit'],
            'sr': [screen.availHeight, 'x', screen.availWidth],
            'vp': [innerWidth, 'x', innerHeight],
            'dr': [document.referrer]
        };
        for (var key in optional) {
            var value = key + '=' + getOptionalStr(optional[key]);
            if (value) {
                urlBase += '&' + value;
            }
        }

        var sendTo = function(url) {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url);
            } else {
                try {
                    req.open('GET', url, false);
                    req.send();
                } catch (e) {
                    // IE9 throws an error with cross-site XMLHttpRequest so
                    // we fall back to simple image request
                    var i = new Image();
                    i.src = url;
                }
            }
        };

        var eventBuilder = function(event, params) {
            var paramsStr = '';
            for (var key in params) {
                paramsStr += '&' + key + '=' + encodeURIComponent(params[key]);
            }
            return function() {
                var anonymizeIp = galite.anonymizeIp ? '&aip=1' : '';

                sendTo(
                    urlBase +
                    paramsStr +
                    anonymizeIp +
                    '&t=' + encodeURIComponent(event) +
                    '&z=' + new Date().getTime()
                );
            };
        };

        // Delay the page load event by 100ms
        setTimeout(eventBuilder('pageview', null), 100);

        /**
         * Note:
         * unload event does not fire on:
         * - Android chrome on tab closing
         */
        window.addEventListener(
            'unload',
            eventBuilder(
                'timing',
                {
                    'utc': 'JS Dependencies',
                    'utv': 'unload',
                    'utt': (new Date().getTime() - pageLoadedTimestamp)
                }
            )
        );
    });
}) // (window, localStorage, navigator, screen, document, encodeURIComponent);
