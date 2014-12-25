/**
 * The MIT License (MIT)
 *
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// https://raw.githubusercontent.com/sindresorhus/is-finite/master/index.js

var isFinite = Number.isFinite || function (val) {
	// Number.isNaN() => val !== val
	if (typeof val !== 'number' || val !== val || val === Infinity || val === -Infinity) {
		return false;
	}

	return true;
};


// https://raw.githubusercontent.com/sindresorhus/sparkly/master/index.js

var sparkly = function (numbers) {
	if (!Array.isArray(numbers)) {
		throw new TypeError('Expected an array');
	}

	var ticks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
	var finiteNumbers = numbers.filter(isFinite);
	var min = Math.min.apply(null, finiteNumbers);
	var max = Math.max.apply(null, finiteNumbers);
	var f = ((max - min) << 8) / (ticks.length - 1);

	// use a high tick if data is constant
	if (min === max) {
		ticks = [ticks[4]];
	}

	if (f < 1) {
		f = 1;
	}

	return numbers.map(function (el) {
		if (!isFinite(el)) {
			return ' ';
		}

		return ticks[Math.floor(((el - min) << 8) / f)];
	}).join('');
};