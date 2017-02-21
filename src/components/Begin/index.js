const yo = require('yo-yo');
const {doesDecode} = require('../../util');

const PLACEHOLDER = '––––––';

const Begin = (state, send) => {
	const doesCodeInputValueDecode = doesDecode(state.codeInputValue, state.choicesLengths);

  return yo`<div class="Begin Card">
      ${state.isLocked ? yo`<div class="BeginLocked">Submissions Closed</div>` : null}
  	<div class="h2">Already played the game?</div>
  	<div class="label">Enter your code to see how you answered</div>
  	<div class="BeginCode">
  		<div class="BeginCode-control">
  			<input type="text" class="TextInput"
  				value="${state.codeInputValue}"
          placeholder="${PLACEHOLDER}"
  				onkeyup=${(e) => {
  					if (doesCodeInputValueDecode && e.keyCode === 13) {
  						send('load', {code: state.codeInputValue});
  					}
  				}}
  				oninput=${(e) => { send('code-input', {value: e.target.value}); }}
  			/>
  		</div>
  		<div class="BeginCode-control">
  			<div class="Button${doesCodeInputValueDecode ? '' : ' Button--disabled'}"
  				disabled=${!doesCodeInputValueDecode}
  				onclick=${send.event('load', {code: state.codeInputValue})}}>Go</div>
  		</div>
  	</div>
  	${state.isLocked ? null : yo`<div class="h2">Otherwise, read on and have a punt</div>`}
  </div>`;
};

module.exports = Begin;
