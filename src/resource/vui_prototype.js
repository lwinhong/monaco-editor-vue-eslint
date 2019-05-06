
String.prototype.trimStr = function (char, type) {
    if (char) {
        if (type === 'left') {
            return this.replace(new RegExp('^\\' + char + '+', 'g'), '');
        } else if (type === 'right') {
            return this.replace(new RegExp('\\' + char + '+$', 'g'), '');
        }
        return this.replace(new RegExp('^\\' + char + '+|\\' + char + '+$', 'g'), '');
    }
    return this.replace(/^\s+|\s+$/g, '');
};

//字符串扩展
String.format = function (str) {
    var args = arguments, re = new RegExp("%([1-" + args.length + "])", "g");
    return String(str).replace(
        re,
        function ($1, $2) {
            return args[$2];
        }
    );
};

// ReSharper disable once NativeTypePrototypeExtending
String.prototype.format = function() {
    var str = this;
    var args = arguments, re = new RegExp("%([1-" + args.length + "])", "g");
    return String(str).replace(
        re,
        function($1, $2) {
            return args[$2];
        }
    );
};

// ReSharper disable once NativeTypePrototypeExtending
String.prototype.equalIgnoreCase = function(str) {
    if (str && (this.toLowerCase() === str.toLowerCase()))
        return true;
    return false;
};

/**
 * 获取数组中重复的数据
 * @returns {} 
 */
// ReSharper disable once NativeTypePrototypeExtending
Array.prototype.distinct = function() {
    var a = [], b = [], c = [], d;
    var object = this;
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
            d = object[prop];
            if (d === a[prop]) {
                continue;
            } //防止循环到prototype
            if (b[d] !== 1) {
                a.push(d);
                b[d] = 1;
            } else {
                c.push(d);
                d[d] = 1;
            }
        }
    }
    return c.distinct1();
};

/**
 *  去除数组的重复数据
 * @returns {} 
 */
// ReSharper disable once NativeTypePrototypeExtending
Array.prototype.distinct1 = function() {
    var a = [], b = [];
    var object = this;
    for (var prop in object) {
        if (object.hasOwnProperty(prop)) {
            var d = object[prop];
            if (d === a[prop]) continue; //防止循环到prototype
            if (b[d] !== 1) {
                a.push(d);
                b[d] = 1;
            }
        }
    }
    return a;
};

