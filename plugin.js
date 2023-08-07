(function($) {
    $.fn.typingTest = function(options) {

        const settings = $.extend({}, $.fn.typingTest.defaults, options);

        async function getWords() {
            const result = await $.ajax({
                url: settings.api,
                type: 'get',
            });

            return result;
        }

        function initBox($elem) {
            $elem.wrap(`<div class="wrapper"></div>`);
            const $wrapper = $elem.closest('.wrapper');

            const $timeAndWPM = $(`
                <div class="time-wpm">
                    <div class="wpm">0</div>
                    <div class="time">0</div>
                </div>
            `);
            $wrapper.append($timeAndWPM);

            const $words = $(`<div class="words-list"/>`);

            $elem.hide();
            $wrapper.append($words);

            const $actions = $(
                `<div class="actions">
                    <input />
                    <button class="refresh" type="button">Refresh</button>
                </div>
            `);

            $wrapper.append($actions);

            const $results = $(`
                <div class="result">
                    <div class="r-wpm">0</div>
                    <div class="correct-words">0</div>
                    <div class="wrong-words">0</div>
                </div>
            `);
            $wrapper.append($results);

            return $wrapper;
        }

        function createWord($container, word) {
            const $span = $(`<span class="word"/>`);
            $span.text(word);
            $container.append($span);
        }

        function initWords($wrapper, words) {
            const $container = $wrapper.find('.words-list');
            $container.html('');
            for( const word of words ) {
                createWord($container, word);
            }
        }

        function startTime($wrapper) {
            const $time = $wrapper.find('.time');
            window.timer = setInterval(function() {
                let currentTime = parseInt($time.text());
                currentTime++;
                $time.text(currentTime);
            }, 1000);
        }

        function stopTime() {
            clearInterval(window.timer);
        }

        function calculateWPM($wrapper) {
            // gross WPM
            const $words = $wrapper.find('.word');
            let totalLettersInput = 0;
            let incorrectWords = 0;
            $words.each(function() {
                totalLettersInput += ($(this).data('typed') ? $(this).data('typed').length + 1 : 0);
                if( $(this).hasClass('wrong') ) {
                    incorrectWords++;
                }
            });
            const time = $wrapper.find('.time').text();

            // convert sec to minute
            const min = time / 60;

            // gross words per minute
            let gwpm = (totalLettersInput/5)/min;

            // net words per minute
            let nwpm = gwpm - (incorrectWords/min);

            nwpm = Math.floor(nwpm);

            $wrapper.find('.wpm').text(nwpm);
        }

        function typing($wrapper, $input) {
            if( $wrapper.hasClass('done') ) return;

            const $container = $wrapper.find('.words-list');
            let $activeWord = $container.find('.active');
            let typingWord = $input.val();
            if( ! $activeWord.length ) {
                $activeWord = $wrapper.find('.word:first-child');
                $activeWord.addClass('active');
                if( typingWord.length ) {
                    startTime($wrapper);
                }
            }

            const activeWord = $activeWord.text();

            // check if space is press
            if( typingWord.indexOf(' ') > -1 ) {
                typingWord = $.trim(typingWord);
                $input.val('');

                if( activeWord == typingWord ) {
                    $activeWord.addClass('correct');
                } else {
                    $activeWord.addClass('wrong');
                }

                $activeWord.removeClass('active');
                $activeWord.data('typed', typingWord);

                // move to the next word
                if( $activeWord.next().length ) {
                    $activeWord.next().addClass('active');
                } else {
                    // finished
                    $wrapper.addClass('done');
                    stopTime();
                    calculateWPM($wrapper);
                }
                calculateWPM($wrapper); 
            } else {
                $activeWord.removeClass('wrong');
                if( activeWord.indexOf(typingWord) != 0 ) {
                    $activeWord.addClass('wrong');
                }
            }
        }

        return this.each(function() {
            const $wrapper = initBox($(this));
            const refreshWords = () => {
                stopTime();
                $wrapper.removeClass('done');
                $wrapper.find('.time').text(0);
                $wrapper.find('.wpm').text(0);
                $wrapper.find('input').val('').focus();
                getWords().then((res) => {
                    initWords($wrapper, res);
                });
            };

            refreshWords();

            $wrapper.find('input').on('keyup', function() {
                typing($wrapper, $(this));
            });

            $wrapper.find('.refresh').on('click', refreshWords);
        });
    }

    $.fn.typingTest.defaults = {
        api: 'https://random-word-api.vercel.app/api?words=10',
    };

}(jQuery));
