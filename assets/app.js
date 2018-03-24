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
            requestContents.call(xhr, cb);
        };

        xhr.onerror = function () {
            console.log('Connection Error');
        };
        xhr.send();
    }

    function requestContents(cb) {
        try {
            if (this.status === 200) {
                var response = JSON.parse(this.responseText);
                return cb(response);
            } else {
                console.log('Connected to a server but returned an error. Status: ' + this.status + '. Text: ' + this.statusText);
            }
        } catch (e) {
            alert('Exception:' + e.description);
        }
    }

    // select input field
    var searchField = document.getElementsByClassName('input-text')[0];

    (function searchBox() {

        // cache coin suggestions
        var matchingCoins = {};

        // monitor input changes
        searchField.addEventListener('input', function () {
            console.log('Start event on input field');
            // check if there's already characters entered
            if (this.value.length === 1) {
                // if only first character is entered, make request API for coin list
                lookupAPI();
            } else if (this.value.length === 0) {
                matchingCoins = {};
                document.getElementById('dropdown-content').innerHTML = '';
            } else {
                // if yes, search for matches from matchingCoins array
                // make sure that there are matches to display
                if (Object.keys(matchingCoins).length > 0) {
                    document.getElementById('dropdown-content').innerHTML = '';
                    displayMatches(matchingCoins);
                }
            }
        });

        // request API for suggestions
        function lookupAPI() {
            makeRequest('https://min-api.cryptocompare.com/data/all/coinlist', function (data) {
                // get coin list
                console.log('Start API request');
                var coins = data.Data;
                var match = new RegExp('^' + searchField.value, 'i');
                Object.keys(coins).forEach(function (key) {
                    // check if coin ticker or name match input
                    if (match.test(coins[key].CoinName) === true || match.test(coins[key].Symbol)) {
                        // filter out small coins
                        if (coins[key].IsTrading === true && coins[key].SortOrder <= 100) {
                            // store ticker and name in an object
                            matchingCoins[key] = coins[key].CoinName;
                        }
                    }
                });

                // if coins were stored
                //console.log(Object.keys(matchingCoins).length);
                if (searchField.value) {
                    // display suggestions in suggestion dropdown
                    displayMatches(matchingCoins);
                }
            });
        }


        // show coin suggestions from object on input 
        function displayMatches(obj) {
            console.log('Display suggestions');
            var dropdown = document.getElementById('dropdown-content');
            // reset dropdown menu
            dropdown.innerHTML = '';
            // construct a temp string for HTML insertion
            var temp = '<ul>';
            // match beginning to input field
            var match = new RegExp('^' + searchField.value, 'i');
            // check if coin ticker or name match the input
            Object.keys(obj).forEach(function (key) {
                if (match.test(key) === true || match.test(obj[key])) {
                    // concat coin names in a list
                    temp += '<li class="suggested-coin">' + obj[key] + '</li>';
                }
            })
            temp += '</ul>';
            dropdown.innerHTML = temp;

            // highlight suggestion
            var suggestions = document.querySelectorAll('.suggested-coin');
            // set initial highlight
            searchField.current = suggestions[0];

            // check if there's current value 
            // in case API call is late

            // highlight first choice
            searchField.current.classList.toggle('suggested-coin-actv');

            // listen for arrow keys to change suggestions
            // and for enter key to set input value

            searchField.onkeypress = function (e) {
                console.log(e.keyCode);
                // key down
                if (e.keyCode === 40) {
                    // if currently on last element, change last to first
                    // while changing highlight from last to first
                    console.log(this)
                    if (!this.current.nextElementSibling) {
                        highlight.call(searchField.current);
                        searchField.current = suggestions[0];
                        highlight.call(searchField.current);
                        // else, remove highlight and move to next current element
                    } else {
                        highlight.call(searchField.current);
                        searchField.current = this.current.nextElementSibling;
                        highlight.call(searchField.current);
                    }
                }

                // key up
                if (e.keyCode === 38) {
                    // if currently on last element, change last to first
                    // while changing highlight from last to first
                    console.log(this);
                    if (!this.current.previousElementSibling) {
                        highlight.call(searchField.current);
                        searchField.current = suggestions[suggestions.length - 1];
                        highlight.call(searchField.current);
                        // else, remove highlight and move to next current element
                    } else {
                        highlight.call(searchField.current);
                        searchField.current = this.current.previousElementSibling;
                        highlight.call(searchField.current);
                    }
                }
            };


            for (var i = 0; i < suggestions.length; i++) {
                // highlight on mouse over
                suggestions[i].addEventListener('mouseenter', function () {
                    // remove highlight from a current element
                    searchField.current.classList.toggle('suggested-coin-actv');
                    // set current to mouse over element
                    searchField.current = this;
                    highlight.call(this);
                });

            }

        }

        // toggle color change
        function highlight() {
            this.classList.toggle('suggested-coin-actv');
        }



    })();

}