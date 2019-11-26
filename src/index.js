const { Client } = require("@abcnews/poll-counters-client");
const fastclick = require("fastclick");
const app = require("./app");
require("./index.scss");

const PROJECT_NAME = "interactive-oscars-predictions";

const init = (config, $begin, $$questions, $end) => {
  const title = document.title.split(" -")[0];
  const hash = window.location.hash.replace("#", "");
  const url = window.location.href.replace(window.location.hash, "");

  if (hash.length) {
    history.replaceState({}, document.title, url);
  }

  config.title = title;
  config.url = url;
  config.hash = hash.length ? hash : null;

  if (typeof config.dbDump !== "object") {
    config.pollCountersClient = new Client(`${PROJECT_NAME}__${config.id}`);
  }

  app(config, (err, views) => {
    if (err) {
      throw err;
    }

    $begin.append(views.begin);

    $$questions.each((index, el) => {
      const $question = $(el);
      const id = $question.data(dataAttr("question"));
      const question = config.questions.filter(question => {
        return question.id === id;
      })[0];

      if (question == null) {
        return;
      }

      $question.append(views.questions[id]);
    });

    $end.append(views.end);
  });
};

const dataAttr = key => [PROJECT_NAME, key].join("-");

const dataAttrSelector = key => "[data-" + dataAttr(key) + "]";

const getByKey = key => {
  const $els = $(dataAttrSelector(key));

  if (!$els.length) {
    throw '"' + key + '" not found';
  }

  return $els;
};

const unwrapped = ($el, _el) => {
  const is$Map = typeof $el === "number";

  $el = is$Map ? $(_el) : $el;

  $el.unwrap();

  // If last element we unwrapped was just the preview site's
  // <span id="CTX-\d+"> wrapper, we need to unwrap again.
  if ($el.parent().is(".html-fragment")) {
    $el.unwrap();
  }

  return is$Map ? $el.get() : $el;
};

$(() => {
  const $begin = unwrapped(getByKey("begin").first());
  const $$questions = getByKey("question").map(unwrapped);
  const $end = unwrapped(getByKey("end").first());
  const configURL = getByKey("config")
    .first()
    .data(dataAttr("config"));
  const fetches = [$.Deferred(), $.Deferred()];

  $.getJSON(configURL).done(config => fetches[0].resolve(config));

  try {
    $.getJSON(
      getByKey("db-dump")
        .first()
        .data(dataAttr("db-dump"))
    ).done(dbDump => fetches[1].resolve(dbDump));
  } catch (e) {
    fetches[1].resolve();
  }

  $.when(fetches[0], fetches[1]).done((config, dbDump) => {
    config.dbDump = dbDump;
    config.localStorageKey = PROJECT_NAME;
    init(config, $begin, $$questions, $end);
  });

  fastclick(document.body);
});
