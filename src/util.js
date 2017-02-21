const baseN = require('base-n');

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

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

module.exports = {encode, decode, doesDecode};
