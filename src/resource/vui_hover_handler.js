
/**
 * 鼠标 hover 提示信息处理
 */
var hover = (function () {

    var regTagEnd = /<\/([\w-\s]+)/;
    var tagStart = /<([\w-]+)/;

    /**
    * 生成hover数据对象
    * @param {标题} title 
    * @param {内容} value 
    * @returns {} 
    */
    function getHoverObject(title, value) {
        return {
            contents: [
                { value: String.format("**%1**", title)},
                {
                    value: '```html\n' + value + "\n\n更多详细：Shift + F1" + '\n```'
                }
            ]
        };
    }

    /**
     * 获取标签提示信息
     * @param {标签} tag 
     * @returns {} 
     */
    function getVuiHoverData(tag) {
        var vui = vuiDataHandler.getVuiData(tag);
        if (vui) {
            var title = vui.label;
            var value = vuiDataHandler.replaceJsonChar(vui.desc)
                + "\n\n" + vuiDataHandler.replaceJsonChar(vui.example);
            return getHoverObject(title, value);
        }
        return null;
    }

    /**
     * 获取属性hover数据
     * @param {标签} tag 
     * @param {属性名称} prop 
     * @returns {} 
     */
    function getVuiPropHoverData(tag, prop) {
        var propData = vuiDataHandler.getVuiPropData(tag, prop);
        var value;
        var title;
        if (propData) {
            title = propData.name;
            value = vuiDataHandler.replaceJsonChar(propData.desc) + "\n" + vuiDataHandler.replaceJsonChar(propData.example);
            return getHoverObject(title, value);
        } else { //如果当前属性在vui标签中没有就找公共的
            var commonOptions = vuiDataSourceHandler.vuiCommonPropsJsonData();
            if (commonOptions && commonOptions[prop]) {
                title = vuiDataHandler.replaceJsonChar(commonOptions[prop].name);
                value = vuiDataHandler.replaceJsonChar(commonOptions[prop].desc);
                return getHoverObject(title, value);
            }
        }
        return null;
    }

    /**
     * hover处理器
     * @param {} model 
     * @param {} position 
     * @returns {} 
     */
    function hoverHandler(model, position) {
        var word = model.getWordAtPosition(position);
        var endColumn = position.column;
        if (word)
            endColumn = word.endColumn;

        //var lineCount = model.getLineCount();
        var startLineNumber = 1;
        if (position.lineNumber > 50) {
            startLineNumber = position.lineNumber - 50;
        }

        //获取开始倒光标位置的文本
        var text = model.getValueInRange({
            startLineNumber: startLineNumber, startColumn: 1,
            endLineNumber: position.lineNumber, endColumn: endColumn
        });
        if (text === "")
            return {};

        //获取开始倒光标位置的文本tokens
        var tokens = monaco.editor.tokenize(text, "html");

        //将所有的tokens当作一行来处理
        var megerTotens = new Array();
        $.each(tokens, function (index, obj) {
            megerTotens = megerTotens.concat(obj);
        });

        var token1 = megerTotens[megerTotens.length - 1];
        //如果不是html 就不用做处理
        if (token1.language !== "html")
            return {};

        var substringText = text.substring(text.lastIndexOf("<"));
        var result;
        //鼠标在标签结尾上
        if (substringText.startsWith("</")) {
            var s = substringText.match(regTagEnd);
            result = getVuiHoverData(s[1]);
            if (result)
                editorData[editorKey.html].editor.setPosition(position);
            return result;
        }

        var startTag = substringText.match(tagStart);
        if (startTag) {
            var st = startTag;//substringText.match(tagStart);
            //在属性上
            if (token1.type === "attribute.name.html") {
                result = getVuiPropHoverData(st[1], word.word);
                if (result)
                    editorData[editorKey.html].editor.setPosition(position);
                return result;
            }
            result = getVuiHoverData(st[1]);
            if (result)
                editorData[editorKey.html].editor.setPosition(position);
            return result;
        }
        return {};
    }

    function hoverHandler2(model, position) {
        var word = model.getWordAtPosition(position);
        if (!word)
            return null;

        var tokensAtLine = vuiHelp.getTokensAtLine(position.lineNumber, model);
        if (!tokensAtLine) {
            return null;
        }

        var result= null;
        for (var i = tokensAtLine.length - 1; i >= 0; i--) {
            var t = tokensAtLine[i];
            if (position.column - 1 >= t.offset) {
                //属性
                if (t.type === "attribute.name.html") {
                    var substringText = vuiHelp.getLastHtml(position, model, word);
                    var startTag = substringText.match(tagStart);
                    if (startTag) {
                        var prop = vuiDataHandler.getLastProp(substringText + '=""');
                        result = getVuiPropHoverData(startTag[1], prop ? prop : word.word);
                    }

                } else if (t.type === "tag.html") {//标签
                    result = getVuiHoverData(word.word);
                }
                break;
            }
        }
        //if (result)
        //    editorData[editorKey.html].editor.setPosition(position);

        return result;
    }

    return { hoverHandler: hoverHandler2 };
})();

