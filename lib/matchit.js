'use strict';

const every = require('@arr/every');

const SEP = '/';
// Types ~> static, param, any, optional
const STYPE=0, PTYPE=1, ATYPE=2, OTYPE=3;
// Char Codes ~> / : *
const SLASH=47, COLON=58, ASTER=42, QMARK=63;

function strip(str) {
	if (str === SEP) return str;
	(str.charCodeAt(0) === SLASH) && (str=str.substring(1));
	var len = str.length - 1;
	return str.charCodeAt(len) === SLASH ? str.substring(0, len) : str;
}

function split(str) {
	return (str=strip(str)) === SEP ? [SEP] : str.split(SEP);
}

function isMatch(arr, obj, idx) {
	idx = arr[idx];

	if (obj.val === idx && obj.type === STYPE) {
		return true
	}

	if (idx === SEP) {
		return obj.type > PTYPE
	}

	if (obj.type === STYPE) {
		return false
	}

	/**
	 * When param is not the last param
	 */
	if (idx === '') {
		return obj.end === '' && (!!obj.matcher ? obj.matcher.test(idx) : true)
	}

	/**
	 * Last param
	 */
	if (!idx) {
		return obj.end === ''
	}

	return idx.endsWith(obj.end) && (!!obj.matcher ? obj.matcher.test(idx) : true)
}

function match(str, all) {
	let segs=split(str), len=segs.length, l;
	let i=0, tmp;
	var fn = isMatch.bind(isMatch, segs);

	for (; i < all.length; i++) {
		tmp = all[i];
		if ((l=tmp.length) === len || (l < len && tmp[l-1].type === ATYPE) || (l > len && tmp[l-1].type === OTYPE)) {
			if (every(tmp, fn)) return tmp;
		}
	}

	return [];
}

function parse(str, matchers) {
	if (str === SEP) {
		return [{ old:str, type:STYPE, val:str, end:'' }];
	}

	if (typeof matchers !== 'object') {
		matchers = {};
	}

	let c, x, t, sfx, val, nxt=strip(str), i=-1, j=0, len=nxt.length, out=[];

	while (++i < len) {
		c = nxt.charCodeAt(i);

		if (c === COLON) {
			j = i + 1; // begining of param
			t = PTYPE; // set type
			x = 0; // reset mark
			sfx = '';

			while (i < len && nxt.charCodeAt(i) !== SLASH) {
				c = nxt.charCodeAt(i);
				if (c === QMARK) {
					x=i; t=OTYPE;
				} else if (c === 46 && sfx.length === 0) {
					sfx = nxt.substring(x=i);
				}
				i++; // move on
			}

			val = nxt.substring(j, x||i);
			const matcher = matchers[val]

			out.push({
				old: str,
				type: t,
				val: val,
				end: sfx,
				matcher: matcher && matcher.match,
				cast: matcher && matcher.cast
			});

			// shorten string & update pointers
			nxt=nxt.substring(i); len-=i; i=0;

			continue; // loop
		} else if (c === ASTER) {
			out.push({
				old: str,
				type: ATYPE,
				val: nxt.substring(i),
				end: ''
			});
			continue; // loop
		} else {
			j = i;
			while (i < len && nxt.charCodeAt(i) !== SLASH) {
				++i; // skip to next slash
			}

			val = nxt.substring(j, i);

			out.push({
				old: str,
				type: STYPE,
				val: val,
				end: ''
			});
			// shorten string & update pointers
			nxt=nxt.substring(i); len-=i; i=j=0;
		}
	}

	return out;
}

function exec(str, arr) {
	let i=0, x, y, segs=split(str), out={};
	for (; i < arr.length; i++) {
		x=segs[i]; y=arr[i];
		if (x === SEP) continue;

		if (y.val === '*') {
			out[y.val] = segs.slice(i).map((value) => {
				try {
					return decodeURIComponent(value)
				} catch {
					return value
				}
			})
			break
		}

		if (x !== void 0 && y.type | 2 === OTYPE) {
			console.log(y)
			let value = x.replace(y.end, '');
			try {
				value = decodeURIComponent(value)
			} catch {}
			out[ y.val ] = y.cast ? y.cast(value) : value
		}
	}
	return out;
}

exports.exec = exec;
exports.match = match;
exports.parse = parse;