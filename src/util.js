const baseN = require('base-n');
const raf = require('raf');

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SCROLL_DURATION = 1000;
const SCROLL_EL_Y_OFFSET = 100;

const bitSize = num => num.toString(2).length;
const b36 = baseN.create({characters: CHARSET});

const encode = (guesses, choicesLengths) => {
	const value = choicesLengths.reduce((acc, choicesLength, index) => {
		acc.value += guesses[index] << acc.shift;
		acc.shift += bitSize(choicesLength);

		return acc;
	}, {shift: 0, value: 0}).value;

	const code = b36.encode(value);

	return code;
};

const validateChar = char => {
	if (CHARSET.indexOf(char) < 0) {
		throw 'code char is not valid';
	}
};

const decode = (code, choicesLengths) => {
	if (typeof code !== 'string') {
		throw 'code is not an string';
	}

	code = code.toUpperCase();

	code.split('').forEach(validateChar);

	const value = b36.decode(code);
	const valueSize = bitSize(value);

	const guesses = choicesLengths.reduce((acc, choicesLength, index) => {
		const shift = bitSize(choicesLength);
		const mask = parseInt('1'.repeat(Math.max(0, valueSize - shift))
			.concat('0'.repeat(shift)), 2);

		acc.guesses.push((value >>> acc.shift) & ~mask);
		acc.shift += shift;

		return acc;
	}, {shift: 0, guesses: []}).guesses;

	return guesses;
};

const doesDecode = (code, choicesLengths) => {
	try {
		decode(code, choicesLengths);
	} catch (e) {
		return false;
	}

	return !!code;
};

const easeInOutQuint = (t, b, _c, d) => {
  const c = _c - b;

  if ((t /= d / 2) < 1) {
    return c / 2 * t * t * t * t * t + b;
  }

  return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
};

const scrollToEl = el => {
  const begin = window.pageYOffset;
  const diff = el.getBoundingClientRect().top - SCROLL_EL_Y_OFFSET;
  const absDiff = Math.abs(diff);
  const end = begin + diff;
  const startTime = Date.now();

  const scroll = () => {
    const now = Date.now();
    const time = now - startTime;

    if (time < SCROLL_DURATION) {
      window.scrollTo(0, easeInOutQuint(time, begin, end, SCROLL_DURATION));
      raf(scroll);
    } else {
      window.scrollTo(0, end);
    }
  };

  raf(scroll);
};

module.exports = {encode, decode, doesDecode, scrollToEl};
