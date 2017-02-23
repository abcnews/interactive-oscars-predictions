const yo = require('yo-yo');

const START = new Date(Date.UTC(2017, 1, 27, 1, 30));
const START_DAY_TEXT = ['Sunday', 'Monday'][START.getDay()];
const START_TIME_TEXT = START.toTimeString().substr(0, 5);

const End = (state, send) => {
	const guesses = state.questions.reduce((memo, question) => {
		if (question.guess === null) {
			return memo;
		}

    return memo.concat(question.guess);
  }, []);

  if (state.code === null || guesses.length < state.questions.length) {
  	return yo`<div></div>`;
  }

  const emailBody = `My code for checking my Oscars predictions: ${state.code}\n\n${state.url}#${state.code}`;

  let encodedShareText = state.encodedTitle;

  if (state.isLocked) {
    encodedShareText += encodeURIComponent('. My code is: ' + state.code);
  }

  return yo`<div class="End Card">
  	${state.wasCompletedManually ? yo`<div class="h1">Done!</div>` : null}
  	<div class="h2">To see how ${state.wasCompletedManually ? 'your' : 'these'} answers stack up to the results, copy this unique code or email it to yourself and ${state.isLocked ? 'check back later' : `come back on ${START_DAY_TEXT} at ${START_TIME_TEXT}`}</div>
  	${EndCode(state.code)}
  	<a class="EndEmail" href="mailto:?to=&subject=${state.encodedTitle}&body=${encodeURIComponent(emailBody)}">
  		<div class="Button">Email this code to yourself</div>
  	</a>
  	<div class="h2">Share the love</div>
    <div class="EndShare">
      <a class="EndShare-link EndShare-link--facebook" href="http://www.facebook.com/sharer.php?u=${state.encodedURL}&t=${encodedShareText}">
        <div class="Button">Facebook</div>
      </a>
      <a class="EndShare-link EndShare-link--twitter" href="http://twitter.com/intent/tweet?url=${state.encodedURL}&related=abcnews&text=${encodedShareText}">
        <div class="Button">Twitter</div>
      </a>
      <a class="EndShare-link EndShare-link--whatsapp" href="whatsapp://send?text=${encodedShareText}%20${state.encodedURL}">
        <div class="Button">WhatsApp</div>
      </a>
    </div>
  	${state.isLocked ? null : yo`<div class="h2">Not happy with how you answered?</div>`}
    ${state.isLocked ? null : yo`<div class="EndReset">
  	  <div class="Button" onclick=${send.event('reset')}>Have another go at it</div>
    </div>`}
  </div>`;
};

const EndCode = code => {
	return yo`<div class="EndCode">
  	${code.split('').map(char => {
  		return yo`<span class="is-${(+char == char) ? 'number' : 'letter'}">${char}</span>`;
  	})}
  </div>`;
};

module.exports = End;
