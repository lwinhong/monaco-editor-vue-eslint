
/**
 * 快捷帮助shift + f1
 */
var vuiHelp = (function () {

    /**
     * 提供给winform打开帮助
     * @returns {} 
     */
    function openHelp4Winform() {
        var current = getSelectedEditorData(null);
        if (current && current.key === editorKey.html) {
            openHelp(null, current.model, current.editor);
        }
    }

    /**
     * 打开帮助
     * @param {按键事件} e 
     * @param {model} model 
     * @param {editor} editor 
     * @returns {} 
     */
    function openHelp(e, model, editor) {

        /*shift + f1*/
        //if (e.keyCode !== 59 || e.ctrlKey || !e.shiftKey || e.altKey)
        //    return;
        if (e)
            e.preventDefault();

        var helpKey = tryToGetSelectedHelpKey(editor, model);
        //if (helpKey) {
        executeCmdWithValue(cmdData.f1Help, helpKey);
        //}
    }

    /**
     * 获取鼠标所在的helpky
     * @param {} editor 
     * @param {} model 
     * @returns {} 
     */
    function tryToGetSelectedHelpKey(editor, model) {

        var position = editor.getPosition();
        var wordAtPosition = model.getWordAtPosition(position);
        if (!wordAtPosition)
            return null;

        var result = null;
        var currentWord = wordAtPosition.word;

        var tokensAtLine = getTokensAtLine(position.lineNumber, model);
        for (var i = tokensAtLine.length - 1; i >= 0; i--) {
            var t = tokensAtLine[i];
            if (position.column - 1 >= t.offset) {
                if (t.type === "attribute.value.html") { //属性值
                    var tagName1 = tryToGetTag(position, model, wordAtPosition);
                    result = getVuiHelpKey(tagName1);
                } else if (t.type === "attribute.name.html") {//属性
                    var isExist = vuiDataSourceHandler.getVlangWithCode(currentWord);
                    if (!isExist) {
                        currentWord = tryToGetLastAttr(position, model, wordAtPosition);
                        if (currentWord) {
                            isExist = vuiDataSourceHandler.getVlangWithCode(currentWord);
                        }
                    }
                    if (isExist)
                        result = "helpType=vlang&helpKey=" + currentWord;

                    //如果找不到v指令的属性，就试着找该属性所在的标签名称
                    if (!result) {
                        var tagName = tryToGetTag(position, model, wordAtPosition);
                        result = getVuiHelpKey(tagName);
                        if (result) {
                            result += "&attr=" + currentWord;
                        }
                    }

                } else if (t.type === "tag.html") {
                    result = getVuiHelpKey(currentWord);
                }
                break;
            }
        }
        return result;
    }

    /**
     * 获取最后一个属性
     * @param {} position 
     * @param {} model 
     * @param {} currentWord 
     * @returns {} 
     */
    function tryToGetLastAttr(position, model, currentWord) {
        var substringText = getLastHtml(position, model, currentWord);
        if (!substringText)
            return null;

        var prop = vuiDataHandler.getLastProp(substringText + '=""');
        if (prop)
            prop = prop.trimStr(":", "left");
        return prop;
    }

    /**
     * 获取标签名称
     * @param {} position 
     * @param {} model 
     * @returns {} 
     */
    function tryToGetTag(position, model, currentWord) {

        var substringText = getLastHtml(position, model, currentWord);
        if (!substringText)
            return null;

        var tagMatch = substringText.match(tagStart);
        if (tagMatch) {
            return tagMatch[1];
        }

        return null;
    }

    /**
     * 获取当前光标下前50行的html 文本
     * @param {} position 
     * @param {} model 
     * @param {} currentWord 
     * @returns {} 
     */
    function getLastHtml(position, model, currentWord) {

        var startLineNumber = 1;
        if (position.lineNumber > 50) {
            startLineNumber = position.lineNumber - 50;
        }

        var endCol = position.column;
        if (currentWord) {
            endCol = currentWord.endColumn;
        }
        //获取开始倒光标位置的文本
        var text = model.getValueInRange({
            startLineNumber: startLineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: endCol
        });

        var textTrimed = $.trim(text);
        //空白什么都没
        if (!textTrimed)
            return null;

        var substringText = text.substring(text.lastIndexOf("<"));
        return substringText;
    }


    /**
     * 获取vui标签的helpkey
     * @param {标签名称} tag 
     * @returns {helpkey} 
     */
    function getVuiHelpKey(tag) {
        if (tag) {
            var allVui = vuiDataHandler.getVuiData(tag);
            if (allVui) {
                var result = "helpType=vui&helpKey=" + tag;
                return result;
            }
        }
        return null;
    }

    function getStateBeforeLine(lineNumber, model) {

        var state = model._tokens.tokenizationSupport.getInitialState();

        for (let i = 1; i < lineNumber; i++) {
            var tokenizationResult = model._tokens.tokenizationSupport.tokenize(model.getLineContent(i), state, 0);
            state = tokenizationResult.endState;
        }

        return state;
    }

    function getTokensAtLine(lineNumber, model) {
        var stateBeforeLine = getStateBeforeLine(lineNumber, model);
        var tokenizationResult1 = model._tokens.tokenizationSupport.tokenize(model.getLineContent(lineNumber), stateBeforeLine, 0);
        return tokenizationResult1.tokens;
    }


    return {
        openHelp: openHelp,
        getTokensAtLine: getTokensAtLine,
        getLastHtml: getLastHtml,
        openHelp4Winform: openHelp4Winform
    };
})();