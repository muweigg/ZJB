import 'core-js/es6/promise';
import 'core-js/es6/string';
import 'core-js/es6/set';
// import 'core-js/es6/regexp';
import 'core-js/es6/symbol';
import 'core-js/es7/string';
// import 'core-js/stage/2';
import 'core-js/fn/object/assign';
import 'core-js/fn/array/of';
import 'core-js/fn/array/from';

// ie9
import './classList.min';
import './xdr';

import browserHelper from './browserHelper';
import _, { camelCase, isNil } from 'lodash';

Number.prototype.toUpperCase = function () {
    let upperCase = { '0': '零', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九' },
        unit = ['', '十', '百', '千', '万'],
        zero = `\\u${upperCase[0].codePointAt(0).toString(16)}`,
        rule = new RegExp(`${zero}+`, 'g'),
        rule2 = new RegExp(`${zero}+$`, 'g');

    let str = Math.floor(this).toString().split('').reverse(),
        digits = str.length,
        result = '';

    for (let [i, v] of str.entries()) {
        let d = parseInt(str[i + 1]);
        v = parseInt(v);
        result = (digits == 2 && i === 1 && v === 1? '' : upperCase[v])
                    + (v === 0 ? '' : unit[i])
                    + result;
    }
    result = result.replace(rule, upperCase[0]).replace(rule2, '');
    return result;
}

Node.prototype.set = function (attribute, value) {
    if (_.isNil(attribute)) return this;
    value = _.isNil(value) ? '' : value;
    if (browserHelper.isIE && browserHelper.ieVer < 11) {
        this.setAttribute(`data-${attribute}`, value);
    } else {
        attribute = _.camelCase(attribute);
        this.dataset[attribute] = value;
    }
    return this;
}

Node.prototype.get = function (attribute) {
    if (_.isNil(attribute)) return '';
    if (browserHelper.isIE && browserHelper.ieVer < 11) {
        return this.getAttribute(`data-${attribute}`);
    } else {
        return this.dataset[attribute];
    }
}

Node.prototype.del = function (attribute) {
    if (_.isNil(attribute)) return this;
    if (browserHelper.isIE && browserHelper.ieVer < 11) {
        this.removeAttribute(`data-${attribute}`);
    } else {
        attribute = _.camelCase(attribute);
        delete this.dataset[attribute];
    }
    return this;
}
