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
        // NOTE: onload expects a function reference
        // to which we can't pass arguments
        // have to assign a function to it whithin which
        // you can call the desired function with arguments

        xhr.onload = function () {
            // explicit binding
            // because requestContents doesn't belong/exists to xhr
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
            var temp = '<ul class="suggestions-list">';
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
            // check if there'are matching suggestions
            if (suggestions.length > 0) {
                // set initial highlight
                searchField.current = suggestions[0];

                // highlight first choice
                searchField.current.classList.toggle('suggested-coin-actv');

                // listen for arrow keys to change suggestions
                // and for enter key to set input value

                searchField.onkeypress = function (k) {
                    // NOTE: this is implicitly bound to searchField
                    // onkeypress is a property on searchField, thus function is called
                    // in a context of searchField

                    console.log(k.keyCode);
                    // key down
                    if (k.keyCode === 40) {
                        // if currently on last element, change last to first
                        // while changing highlight from last to first
                        if (!this.current.nextElementSibling) {
                            highlight.call(this.current);
                            this.current = suggestions[0];
                            highlight.call(this.current);
                            // else, remove highlight and move to next current element
                        } else {
                            highlight.call(this.current);
                            this.current = this.current.nextElementSibling;
                            highlight.call(this.current);
                        }
                    }

                    // key up
                    if (k.keyCode === 38) {
                        // if currently on last element, change last to first
                        // while changing highlight from last to first
                        if (!this.current.previousElementSibling) {
                            highlight.call(this.current);
                            this.current = suggestions[suggestions.length - 1];
                            highlight.call(this.current);
                            // else, remove highlight and move to next current element
                        } else {
                            highlight.call(this.current);
                            this.current = this.current.previousElementSibling;
                            highlight.call(this.current);
                        }
                    }

                    // enter key - sets value in input box
                    if (k.keyCode === 13) {
                        this.value = this.current.textContent;
                        document.getElementById('dropdown-content').innerHTML = '';
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
                    suggestions[i].addEventListener('click', function () {
                        searchField.value = this.textContent;
                        document.getElementById('dropdown-content').innerHTML = '';
                    });
                }
            }
        }

        // toggle color change
        function highlight() {
            this.classList.toggle('suggested-coin-actv');
        }
    })();


    // request data basd on input value
    // and display its price
    (function priceChecker() {
        var submit = document.querySelector('#getPrice');
        // on btn click match input value to symbol
        submit.addEventListener('click', function () {
            // clear our previous lookups if any
            removeDisplay();
            // clear display field
            document.getElementById('dropdown-content').innerHTML = '';
            // Remove all saved data from sessionStorage
            sessionStorage.clear();
            // get input value
            submit.value = searchField.value;
            // search for prices based on the input value
            lookupSymbol(submit);
            setInterval(function () {
                // search for prices based on the input value
                lookupSymbol(submit);
            }, 10000);
        });


        function lookupSymbol(inputVal) {
            makeRequest('https://min-api.cryptocompare.com/data/all/coinlist', function (data) {
                console.log('Start to search for matching symbol...');
                // get coin list
                var coins = data.Data;
                var symbol;

                // look up by coin Name first
                Object.keys(coins).forEach(function (key) {
                    // check if coin name matches input
                    if (inputVal.value.toUpperCase() === coins[key].CoinName.toUpperCase()) {
                        symbol = coins[key].Symbol;
                        lookupPrice.call(symbol);
                    }
                });

                // if no match by coin Name, look up by Symbol name
                if (!symbol) {
                    Object.keys(coins).forEach(function (key) {
                        // check if coin ticker matches input
                        if (inputVal.value.toUpperCase() === coins[key].Symbol.toUpperCase()) {
                            symbol = coins[key].Symbol;
                            lookupPrice.call(symbol);
                        }
                    });
                    if (!symbol) {
                        priceNotFound.call('There is no data for the ' + inputVal.value.toUpperCase());
                    }
                }
            });
        };

        function lookupPrice() {
            let url = 'https://min-api.cryptocompare.com/data/price?fsym=' + this + '&tsyms=BTC,ETH,USD';
            makeRequest(url, function (data) {
                console.log('Symbol match found, start looking up prices...')
                let prices = data;
                priceFound.call(prices);
            });
        }

        // if price is found, display a list under input
        function priceFound() {
            // get element where display prices
            let display = document.querySelector('.price');
            // clear our previous lookups if any
            removeDisplay();
            // create a list
            let ul = document.createElement('ul');
            ul.className = 'price-list';
            // append list to display element
            display.appendChild(ul);
            Object.keys(this).forEach(function (key) {
                // create and append a list item for each price
                let li = document.createElement('li');
                let text = document.createTextNode(key + ': ');
                li.appendChild(text);
                let span = document.createElement('span');
                let price = document.createTextNode(this[key]);
                span.classList.add(key);
                span.appendChild(price);
                li.appendChild(span);
                ul.appendChild(li);
            }, this);
            changeColor.call(this);           
            sessionStorage.setItem('prevData', JSON.stringify(this));
        }

        // display response if no match found
        function priceNotFound() {
            console.log('No symbol match found...');
            var display = document.querySelector('.price');
            // clear our previous lookups if any
            removeDisplay();
            var p = document.createElement('p');
            p.className = 'price-list';
            var mes = document.createTextNode(this);
            display.appendChild(p).appendChild(mes);
        }

        // clear our price display field for subsequent lookups
        function removeDisplay() {
            console.log('Removing prev display entry, if any');
            var display = document.querySelector('.price');
            var displayList = document.querySelector('.price-list');
            if (displayList) {
                display.removeChild(displayList);
            }
        }

        // changes color to red/green comparing to previous data call
        function changeColor() {
            // retrieve data from session storage
            let prevPrices = JSON.parse(sessionStorage.getItem('prevData'));
            // if there's price data in session storage, change price color
            if (prevPrices) {
                Object.keys(this).forEach(function (key) {
                    let item = document.querySelector('.' + key);
                    if (prevPrices[key] < this[key]) {
                        item.style.color = 'green';
                    } else if (prevPrices[key] > this[key]) {
                        item.style.color = 'red';
                    }
                }, this);
            }
        }


    })();

}