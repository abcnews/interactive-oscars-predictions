const cmimg = require('util-cmimg');
const yo = require('yo-yo');

const URL_ROOT = '//www.abc.net.au';

const Question = (questionState, state, send) => {
	questionState.publicGuessesTotal = questionState.publicGuesses.reduce((memo, value) => {
		return memo + value;
	}, 0);

	questionState.publicGuessPercentages = questionState.publicGuesses.map(value => {
		return Math.round(value / questionState.publicGuessesTotal * 100);
	});

  return yo`<div class="Question${state.isLocked ? ' Question--locked' : ''} Card">
  	${state.isLocked ? QuestionLabel(questionState) : null}
  	<div class="h1">${questionState.statement}</div>
  	${QuestionPersonalChoices(questionState, state, send)}
  	${state.isLocked && questionState.guess !== null && questionState.answer !== null ? QuestionPersonalResult(questionState) : null}
  	${state.isLocked || questionState.guess !== null ? QuestionPublicTitle(questionState, state) : null}
  	${(state.isLocked && questionState.answer !== null) || questionState.guess !== null ? QuestionPublicResult(questionState, state) : null}
  	${state.isLocked || questionState.guess !== null ? QuestionPublicChoices(questionState, state) : null}
  	${(!state.isLocked && questionState.guess !== null) || (state.isLocked && questionState.answer === null) ? QuestionPublicResponses(questionState) : null}
  </div>`;
};

const QuestionLabel = questionState => {
	const text = questionState.answer !== null ? 'The results are in' : 'Waiting on results';

	return yo`<div class="QuestionLabel">${text}</div>`;
};

const QuestionPersonalChoices = (questionState, state, send) => {
	return yo`<div class="QuestionPersonalChoices">
		${questionState.choices.map((choice, index) => {
			let className = 'Button';

			if (state.isLocked || questionState.guess !== null) {
				className += ' Button--disabled';
			}

			if (state.isLocked && questionState.answer !== null) {
				className += ' Button--' + (questionState.answer === index ? '' : 'in') + 'correct';
			}

			if (questionState.guess === index ||
				state.isLocked && questionState.guess === null && questionState.answer === index) {
				className += ' Button--selected';
			}

			const label = yo`<div>${choice.split(', ').reduce((acc, str, index) => {
				if (index > 0) {
					acc.push(',', yo`<br>`);
				}

				acc.push(str);

				return acc;
			}, [])}</div>`;

			const image = questionState.images ? yo`<img src="${URL_ROOT}${cmimg(questionState.images[index], '3x4')}" />` : null;

			return yo`<div class="QuestionPersonalChoices-choice">
				<div class="${className}" onclick=${send.event('guess', {question: questionState.id, guess: index})} }>${image}${label}</div>
			</div>`;
		})}
	</div>`;
};

const QuestionPersonalResult = questionState => {
	const isCorrect = questionState.answer === questionState.guess;

	return yo`<div class="QuestionPersonalResult QuestionPersonalResult--${isCorrect ? '' : 'in'}correct">
		${isCorrect ? 'Spot on! Good guess.' : 'Nope. Nice try though.'}
	</div>`;
};

const QuestionPublicTitle = (questionState, state) => {
	let text;

	if (state.isLocked && questionState.answer !== null) {
		text = `How did everybody ${questionState.guess === null ? 'answer' :' else go'}?`;
	} else {
		text = `What does everybody${questionState.guess === null ? '' : ' else'} think?`;
	}

	return yo`<div class="QuestionPublicTitle h2" id="QuestionPublicTitle--${questionState.id}">${text}</div>`;
};

const QuestionPublicResult = (questionState, state) => {
	if (state.isLocked && questionState.answer !== null) {
		if (questionState.guess === null) {
			return yo`<div class="QuestionPublicResult">
				${questionState.publicGuessPercentages[questionState.answer]}% of respondents got it right.
			</div>`;
		} else if (questionState.guess === questionState.answer) {
			return yo`<div class="QuestionPublicResult">
				${questionState.publicGuessPercentages[questionState.answer]}% of respondents got it right as well.
			</div>`;
		} else {
			return yo`<div class="QuestionPublicResult">
				<span class="is-negative">${questionState.publicGuessPercentages[questionState.guess]}%</span> of respondents also got this wrong.
				<br>
				<span class="is-positive">${questionState.publicGuessPercentages[questionState.answer]}%</span> got it right though.
			</div>`;
		}
	}

	return yo`<div class="QuestionPublicResult">
		${questionState.publicGuessPercentages[questionState.guess]}% of respondents agree with you${state.isLocked ? '' : ' so far'}.
	</div>`;
};

const QuestionPublicChoices = (questionState, state) => {
	return yo`<div class="QuestionPublicChoices">
		${questionState.choices.map((choice, index) => {
			let className = 'QuestionPublicChoices-choice';

			if (state.isLocked && questionState.answer !== null) {
				className += ' QuestionPublicChoices-choice--' + (questionState.answer === index ? '' : 'in') + 'correct';
			}

			if (questionState.guess === index ||
				state.isLocked && questionState.guess === null && questionState.answer === index) {
				className += ' QuestionPublicChoices-choice--selected';
			}

			return yo`<div class="${className}">
				<div class="QuestionPublicChoices-choicePct">${questionState.publicGuessPercentages[index]}%</div>
				<div class="QuestionPublicChoices-choiceText">${choice}</div>
				<div class="QuestionPublicChoices-choiceTrack"><div style="width: ${questionState.publicGuessPercentages[index]}%;" class="QuestionPublicChoices-choiceBar"></div></div>
			</div>`;
		})}
	</div>`;
};

const QuestionPublicResponses = questionState => {
	return yo`<div class="QuestionPublicResponses">from ${questionState.publicGuessesTotal} responses</div>`;
};

module.exports = Question;
