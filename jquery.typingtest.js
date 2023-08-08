(function($){

    // initialize plugin
    $.fn.typingTest = function(options) {

        const settings = $.extend({}, $.fn.typingTest.defaults, options);

        // get words from API
        async function getWords() {
            const apiUrl = new URL(settings.api);
            apiUrl.searchParams.append('words', settings.words || 10);

            const result = $.ajax({
                url: apiUrl,
            });

            return result;
        }

        const $wrapper = $(settings.template);
        const $wpm = $wrapper.find(`.wpm`);
        const $time = $wrapper.find(`.time`);
        const $words = $wrapper.find(`.words-list`);
        const $refresh = $wrapper.find(`.refresh`);
        const $input = $wrapper.find(`input`);
        const $mistakes = $wrapper.find(`.mistakes`);

        let totalInput = 0;
        let incorrectWords = [];

        // initialize words
        function initWords(words) {
            for( const word of words ) {
                createWord(word);
            }
        }

        function refreshWords() {
            $words.html(`Loading...`);
            getWords().then((res) => {
                $words.html('');
                initWords(res);
            });
            $input.focus();
            stopTime();
            reset();
        }

        function reset() {
            totalInput = 0;
            incorrectWords = [];
            $time.text(0);
            $wpm.text(0)
            $input.val('');
            $mistakes.text('');
            $wrapper.removeClass('finished');
        }

        // create word item
        function createWord(word) {
            const $word = $(`<span class="word" />`);
            $word.text(word);
            $words.append($word);
        }

        function getActiveWord() {
            let $aw = $words.find(`.active`) 
            if( $aw.length ) return $aw;
            $aw = $words.find(`:first-child`).addClass('active');
            startTime();
            return $aw;
        }

        function nextWord() {
            const $aw = getActiveWord();
            const $n = $aw.next();
            $aw.removeClass('active');
            if( $n.length ) {
                $n.addClass('active');
            } else {
                stopTime();
            }

            $input.val('');
        }

        function startTime() {
            window.timer = setInterval(() => {
                let time = parseFloat($time.text());
                time += (1/10);
                $time.text(time.toFixed(1));
                if( time % 1 == 0 ) {
                    calculateWPM();
                }
            }, 100);
        }

        function stopTime() {
            clearInterval(window.timer);
            $wrapper.addClass('finished');
            if( incorrectWords.length ) {
                $mistakes.text(`Mistakes: ${incorrectWords.join(', ')}`);
            }
        }

        function calculateWPM() {
            const time = parseFloat($time.text()) / 60;

            let GWPM = (totalInput / 5) / time;

            let NWPM = parseInt(GWPM - ((incorrectWords.length)/time));
            $wpm.text(NWPM)
        }

        function typing() {
            const $aw = getActiveWord();
            const aw = $aw.text();
            const tw = $input.val();

            if( tw.indexOf(' ') > -1 ) {
                // submitted the word
                if( $.trim(tw) == aw ) {
                    $aw.addClass('correct');
                } else {
                    $aw.addClass('wrong');
                    incorrectWords.push(aw);
                }
                nextWord();
            } else {
                $aw.removeClass('wrong');
                if( aw.indexOf(tw) !== 0 ) {
                    $aw.addClass('wrong');
                }
                totalInput++;
            }
        }

        function init($elem) {
            $elem.hide();
            $elem.after($wrapper);
            refreshWords();
            $refresh.on('click', refreshWords);
            $input.on('input', typing);
        }

        return this.each(function() {
            init($(this));
        });
    };

    // plugin default options
    $.fn.typingTest.defaults = {
        api: 'https://random-word-api.vercel.app/api',
        words: 5,
        template: `
            <div class="wrapper">
                <div class="typing-details">
                    <div class="wpm">0</div>
                    <div class="time">0</div>
                </div>
                <div class="words-list">
                </div>
                <div class="actions">
                    <input />
                    <button type="button" class="refresh">Refresh</button>
                </div>
                <div class="result">
                    <div class="wpm">0</div>
                    <div class="mistakes"></div>
                </div>
            </div>
        `,
    };

}(jQuery));
