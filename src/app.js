const raf = require("raf");
const sendAction = require("send-action");
const yo = require("yo-yo");
const { encode, decode, doesDecode, scrollToEl } = require("./util");
const Begin = require("./components/Begin");
const Question = require("./components/Question");
const End = require("./components/End");

const choicesLengths = question => question.choices.length;

const app = (config, callback) => {
  const choicesLengths = config.questions.map(
    question => question.choices.length
  );

  const isComplete = state =>
    state.questions.every(question => question.guess !== null);

  const submitGuesses = state => {
    if (config.pollCountersClient != null) {
      state.questions.forEach(question => {
        config.pollCountersClient.increment({
          question: question.id,
          answer: String(question.guess)
        });
      });
    }
  };

  const create = publicCounts => {
    config.questions.forEach(question => {
      const publicGuesses = Array.isArray(publicCounts[question.id])
        ? publicCounts[question.id]
        : question.choices.reduce((memo, choice, index) => {
            memo[index] = 0;

            return memo;
          }, {});

      question.publicGuesses = Object.keys(publicGuesses).map(
        choice_index => publicGuesses[choice_index] || 0
      );
    });

    const send = sendAction({
      onaction: (params, state) => {
        let question;

        if (params.question != null) {
          question = state.questions.filter(question => {
            return question.id === params.question;
          })[0];
        }

        switch (params.type) {
          case "code-input":
            state.codeInputValue = params.value;
            break;
          case "load":
            const guesses = decode(params.code, choicesLengths);
            state.code = params.code;
            state.questions = state.questions.map((question, index) => {
              const guess = guesses[index];

              if (
                typeof guess === "number" &&
                question.choices.length > guess
              ) {
                question.guess = guess;
              } else {
                question.guess = null;
              }

              return question;
            });
            break;
          case "guess":
            if (state.isLocked || question == null || question.guess !== null) {
              break;
            }

            question.guess = params.guess;
            question.publicGuesses[params.guess]++;
            const wasLastGuess = isComplete(state);
            if (wasLastGuess) {
              submitGuesses(state);

              state.code = encode(
                state.questions.map(question => question.guess),
                choicesLengths
              );
              window.localStorage.setItem(config.localStorageKey, state.code);
              state.wasCompletedManually = true;
            }

            break;
          case "reset":
            state.questions = state.questions.map(question => {
              question.guess = null;

              return question;
            });
            state.code = null;
            state.wasCompletedManually = false;
            window.localStorage.removeItem(config.localStorageKey);
            window.scrollTo(0, 0);
            break;
          default:
            break;
        }

        return state;
      },
      onchange: (params, state) => {
        raf(() => {
          yo.update(views.begin, Begin(state, send));
          state.questions.forEach(questionState => {
            yo.update(
              views.questions[questionState.id],
              Question(questionState, state, send)
            );
          });
          yo.update(views.end, End(state, send));

          if (params.question != null) {
            const questionPublicTitleEl = document.getElementById(
              `QuestionPublicTitle--${params.question}`
            );

            if (questionPublicTitleEl) {
              scrollToEl(questionPublicTitleEl);
            }
          }
        });
      },
      state: {
        title: config.title,
        url: config.url,
        encodedTitle: encodeURIComponent(config.title),
        encodedURL: encodeURIComponent(config.url),
        isLocked: config.isLocked,
        questions: questionsFromConfig(config),
        code: null,
        codeInputValue: "",
        wasCompletedManually: false,
        choicesLengths
      }
    });

    const initialState = send.state();

    const views = {
      begin: Begin(initialState, send),
      end: End(initialState, send),
      questions: initialState.questions.reduce((memo, questionState) => {
        memo[questionState.id] = Question(questionState, initialState, send);
        return memo;
      }, {})
    };

    const storedCode = window.localStorage.getItem(config.localStorageKey);

    if (doesDecode(config.hash || storedCode, choicesLengths)) {
      send("load", { code: config.hash || storedCode });
    }

    callback(null, views);
  };

  const localFallback = setTimeout(() => create(), 2000);

  if (config.dbDump != null) {
    clearTimeout(localFallback);
    create(config.dbDump);
  } else if (config.pollCountersClient != null) {
    config.pollCountersClient.get((err, group) => {
      clearTimeout(localFallback);
      create(group ? group.value : generateInitialPublicCounts(config));
    });
  } else {
    callback(
      new Error(
        "No database or dbDump provided, or config.id not present in either."
      )
    );
  }
};

function generateInitialPublicCounts(config) {
  return config.questions.reduce((memo, question) => {
    memo[question.id] = question.choices.map(() => 0);

    return memo;
  }, {});
}

const questionsFromConfig = config => {
  return config.questions.map(
    ({ id, statement, choices, images, answer, guess, publicGuesses }) => {
      return {
        id,
        statement,
        choices,
        images,
        answer: answer == null ? null : answer,
        guess: guess == null ? null : guess,
        publicGuesses
      };
    }
  );
};

module.exports = app;
