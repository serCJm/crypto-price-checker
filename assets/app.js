"use strict"

window.onload = function () {

    // clear input field on page reload
    (function clearInput() {
        document.getElementsByClassName('input-text')[0].value = '';
    })();

    function makeRequest(url, cb) {
        var xhr = new XMLHttpRequest();

        if (!xhr) {
            console.log("Can't create XMLHttp Instance");
            return false;
        }

        xhr.open('GET', url, true);
        xhr.onload = function () {
            requestContents(xhr, cb);
        };

        xhr.onerror = function () {
            console.log('Connection Error');
        };
        xhr.send();
    }

    function requestContents(xhr, cb) {
        try {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                return cb(response);
            } else {
                console.log('Connected to a server but returned an error. Status: ' + xhr.status + '. Text: ' + xhr.statusText);
            }
        } catch (e) {
            alert('Exception:' + e.description);
        }
    };

    
        var matchingCoins = {};

        var searchField = document.getElementsByClassName('input-text')[0];
        searchField.addEventListener('input', function () {
            
            console.log('Start event on input field');
            // check if there's already characters entered
            if (searchField.value.length === 1) {
                // if only first character is entered, make request API for coin list
                lookupAPI();
            } else if (searchField.value.length === 0) {
                matchingCoins = {};
                document.getElementById('dropdown-content').innerHTML = '';
            }
            else {
                // if yes, search for matches from matchingCoins array
                displayMatches(matchingCoins);
            }

        });

        function lookupAPI() {
            makeRequest('https://min-api.cryptocompare.com/data/all/coinlist', function (data) {
                // get coin list
                console.log('Start API request');
                var coins = data.Data;
                var match = new RegExp('^' + searchField.value, 'i');
                Object.keys(coins).forEach(function (key) {
                    // check if coin ticker or name match input
                    if (match.test(coins[key].CoinName) === true || match.test(coins[key].Symbol)) {
                        // store ticker and name in an object
                        matchingCoins[key] = coins[key].CoinName;
                    }

                });
                // if coins were stored
                if (Object.keys(matchingCoins).length > 0) {
                    // display suggestions in suggestion dropdown
                    displayMatches(matchingCoins);
                }
            });
        }

        // show coin suggestions from object on input 
        function displayMatches(obj) {
            console.log('Display suggestions');
            var dropdown = document.getElementById('dropdown-content');
            dropdown.innerHTML = '<ul>';
            // match beggining to input field
            var match = new RegExp('^' + searchField.value, 'i');
            // check if coin ticker or name match input
            Object.keys(obj).forEach(function (key) {
                if (match.test(key) === true || match.test(obj[key])) {
                    dropdown.innerHTML += '<li>' + obj[key] + '</li>';
                }
            })
            dropdown.innerHTML += '</ul>';
        }



    ;

}