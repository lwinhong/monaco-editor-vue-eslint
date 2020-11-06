
var tagStart = /<([\w-]+)/;

/**
 * vui智能提示，自动完成数据处理（vui，属性，属性值）
 */
var vuiDataHandler = (function () {

    /**
     * 匹配widget-code
     */
    var widgetCodeReg = /widget-code\s{0,}=\s{0,}["']\s{0,}([\w\S-\.]+)\s{0,}["']/i;
    var widgetCodeRegGlobal = /[:]{0,}widget-code\s{0,}=\s{0,}["']\s{0,}([\w\S-\.]{0,})\s{0,}["']/gi;
    var handleEventReg = /handleEvent\s{0,}\(\s{0,}'([^<](\w|\s|-)*)'/gi;
    var emitEventReg = /\$emit\s{0,}\(\s{0,}'([^<](\w|\s|-)*)'/gi;
    var propReg = /([\w-:\.]+)(\s*=\s*)("[^"]*"|'[^']*')/g;
    var tagEnd = /<\/([\w-\s]+)>/;

    /**
     * 获取指定vui标签的数据
     * @param {vui 标签} vuiTag 
     * @returns {vuidata {vui{label:"xxx",attributesWithDefaultValue:[]}}} 
     */
    function getVuiData(vuiTag) {
        var allTags = vuiDataSourceHandler.vuiJsonData();
        var result;
        $.each(allTags,
            function (vui, data) {
                if (vui.equalIgnoreCase(vuiTag)) {
                    result = data;
                    return false;
                }
                return true;
            });
        return result;
    }

    /**
     * 获取vui属性完成数据
     * @param {} vuiData 
     * @param {} propName 
     * @returns {} 
     */
    function getVuiPropDataExt(vuiData, propName) {
        var result;
        $.each(vuiData.attributes,
            function (prop, data) {
                if (prop.equalIgnoreCase(propName)) {
                    result = data;
                    return false;
                }
                return true;
            });
        return result;
    }

    /**
     * 获取指定标签和属性名词的属性数据
     * @param {vui标签} vuiTag 
     * @param {属性名称} propName 
     * @returns {数据相关数据} 
     */
    function getVuiPropData(vuiTag, propName) {
        var vuiData = getVuiData(vuiTag);
        if (vuiData && vuiData.attributes) {
            var result = getVuiPropDataExt(vuiData, propName);
            if (result)
                return result;

            if (propName.indexOf(":") !== -1) {
                result = getVuiPropDataExt(vuiData,
                    propName.substring(propName.lastIndexOf(":")));
                if (result)
                    return result;

                var clearName = propName.substring(propName.lastIndexOf(":") + 1);
                result = getVuiPropDataExt(vuiData, clearName);
                if (result)
                    return result;
            }
        }
        return null;
    }

    /**
     * 替换json中特殊的转义字符
     * @param {要替换的字符串} replaceString 
     * @returns {替换之后的字符串} 
     */
    function replaceJsonChar(replaceString) {
        if (replaceString === null || replaceString === "" || replaceString === undefined)
            return "";

        replaceString = replaceString.replace(/&lt;/g, "<");
        replaceString = replaceString.replace(/&gt;/g, ">");
        replaceString = replaceString.replace(/&quot;/g, "\"");
        replaceString = replaceString.replace(/&#39;/g, "\'");

        return replaceString;
    }

    /**
     * 根据正则获取存在的编码
     * @param {} reg 
     * @returns {} 
     */
    function getExistCodeCommon(reg, isRemoveComments, isTrimCode, isReturnCodeAndSource) {
        var existCodes = [];
        if (isReturnCodeAndSource)
            existCodes = {};
        var sourceString;
        if (IsDevEditorMode()) {
            sourceString = editorData[editorKey.template].editor.getValue();
        } else {
            sourceString = editorData[editorKey.html].editor.getValue();
        }

        if (isRemoveComments)
            sourceString = saveHandler.removeComments(sourceString);
        if (isTrimCode === undefined)
            isTrimCode = true;

        while (true) {
            var results = reg.exec(sourceString);
            if (results) {
                if (results[0].substr(0, 1) === ":")
                    continue;
                var result = results[1];
                var code = isTrimCode ? result.trim() : result;
                if (isReturnCodeAndSource) {
                    var exist = existCodes[code];
                    if (exist) {
                        exist.push(results[0]);
                    } else {
                        existCodes[code] = [results[0]];
                    }
                } else {
                    existCodes.push(isTrimCode ? result.trim() : result);
                }
            } else {
                break;
            }
        }
        return existCodes;
    }

    function getExistWidgetCodesWithSources() {
        return getExistCodeCommon(widgetCodeRegGlobal, true, false, true);
    }

    var existWidgetCodes;
    /**
    * 获取所有存在的widgetcode
    * @returns {} 
    */
    function getExistWidgetCodes(want2Update, isRemoveComments) {
        if (want2Update || !existWidgetCodes)
            existWidgetCodes = getExistCodeCommon(widgetCodeRegGlobal, isRemoveComments);
        if (!existWidgetCodes)
            existWidgetCodes = [];
        return existWidgetCodes;
    }

    var existEventCodes;
    /**
     * 获取已存在的事件Code
     * @returns {} 
     */
    function getExistEventCodes(want2Update) {
        if (want2Update || !existEventCodes) {
            existEventCodes = IsDevEditorMode()
                ? getExistCodeCommon(emitEventReg) : getExistCodeCommon(handleEventReg);
        }
        if (!existEventCodes)
            existEventCodes = [];
        return existEventCodes;
    }

    /**
     * 新建一个唯一性code
     * @param {} baseName 
     * @param {} existCodes 
     * @returns {} 
     */
    function newUniqueCode(baseName, existCodes) {
        var index = 1;
        while (true) {
            if ($.inArray(baseName + index, existCodes) !== -1) {
                index++;
            } else {
                break;
            }
        }
        return baseName + index;
    }

    /**
     * 获取新的widgetCode
     * @param {标签} tag 
     * @param {已存在的编码} existCodes 
     * @returns {新编码} 
     */
    function newWidgetCode(tag, existCodes) {
        if (!tag)
            tag = "vuicontrol";

        if (!existCodes)
            existCodes = getExistWidgetCodes();

        var existControlCodes = vuiDataSourceHandler.existControlCodeJsonData();
        if (existControlCodes) {
            existCodes = existCodes.concat(existControlCodes);
        }

        return newUniqueCode(divCode + "_" + tag.split("-").join(""), existCodes);
    }

    /**
     * widget-code 属性自动完成数据
     * @param {vui标签} tag 
     * @param {已存在的widget-code编码} existCodes 
     * @returns {} 
     */
    function getWidgetCodeProperty(tag, existCodes) {

        return {
            label: " widget-code",
            kind: monaco.languages.CompletionItemKind.Keyword,
            documentation: "widget-code 全局唯一标识",
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText: 'widget-code="' + newWidgetCode(tag, existCodes) + '"$0'
        };
    }

    /**
     * widget-code 属性值自动完成数据
     * @param {vui标签} tag 
     * @param {已存在的widget-code编码} existCodes 
     * @returns {} 
     */
    function getWidgetCodePropertyValue(tag, existCodes) {
        var newCode = newWidgetCode(tag, existCodes);
        return {
            label: newCode,
            kind: monaco.languages.CompletionItemKind.Keyword,
            documentation: "widget-code 全局唯一标识",
            insertText: {
                value: newCode
            }
        };
    }

    /**
     * 获取新的事件code
     * @param {} baseName 
     * @param {} existEvents 
     * @returns {} 
     */
    function newEventName(baseName, existEvents) {
        return newUniqueCode(baseName, existEvents);
    }

    /**
     * 获取html片段中最后的属性
     * @param {} htmlText 
     * @returns {} 
     */
    function getLastProp(htmlText) {
        try {
            var lastProp = null;
            while (true) {
                var match = propReg.exec(htmlText);
                if (match) {
                    lastProp = match[1];
                } else {
                    return lastProp;
                }
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /**
     * 获取属性值候选项数据
     * @param {} optionKey 
     * @returns {} 
     */
    function getValueOptions(optionKey) {
        if (optionKey) {
            var options = vuiDataSourceHandler.vuiPropValuesJsonData();
            if (options) {
                var result = new Array();
                var keys = optionKey.split("|");
                $.each(keys,
                    function (index, obj) {
                        var option = options[obj];
                        if (option) {
                            result = result.concat(option);
                        }

                    });
                return result;
            }
        }
        return null;
    }

    /**
     * html 智能提示,自动完成处理器
     * @param {model} model 
     * @param {位置} position 
     * @returns {自动完成数据} 
     */
    function autoCompleteHandler(model, position) {

        var startLineNumber = 1;
        if (position.lineNumber > 50) {
            startLineNumber = position.lineNumber - 50;
        }

        //获取开始倒光标位置的文本
        var text = model.getValueInRange({
            startLineNumber: startLineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });

        var textTrimed = $.trim(text);
        //空白什么都没
        if (textTrimed === "")
            return createVuiCompletions(isTriggerByBrackets);

        //获取开始倒光标位置的文本tokens
        var tokens = monaco.editor.tokenize(textTrimed, "html");

        //将所有的tokens当作一行来处理
        var megerTotens = new Array();
        $.each(tokens,
            function (index, obj) {
                megerTotens = megerTotens.concat(obj);
            });

        var token1 = megerTotens[megerTotens.length - 1];
        //如果不是html 就不用做处理
        if (token1.language !== "html")
            return [];

        var substringText = text.substring(text.lastIndexOf("<"));
        //在结束符后面 空格(</tag>)
        if (tagEnd.test(substringText)) {
            return createVuiCompletions(isTriggerByBrackets);
        }

        //在结尾的标签里面空格 </vui 空格 > || </ 空格 vui>
        if (substringText.startsWith("</")) {
            return [];
        }

        //在标签的第一个结束符后面 eg:<button >这里</button>
        if ($.trim(substringText).endsWith(">") && token1.type === "delimiter.html") {
            return createVuiCompletions(isTriggerByBrackets);
        }

        var tagMatch = substringText.match(tagStart);
        var tagName = "";
        if (tagMatch)
            tagName = tagMatch[1];
        var widgetCode = tagName;
        var isExistWidgetCode = false;
        var wcodeReg = substringText.match(widgetCodeReg);
        if (wcodeReg) {
            widgetCode = wcodeReg[1];
            isExistWidgetCode = true;
        }

        //在标签后面输入eg: <button 这里空格 
        if (substringText.endsWith(" ") && token1.type === "tag.html") {
            return createPropCompletions(tagName, widgetCode, isExistWidgetCode);
        }

        if (megerTotens.length > 2) {
            var token2 = megerTotens[megerTotens.length - 2];
            var token3 = megerTotens[megerTotens.length - 3];

            //在标签后面输入eg: <button 这里输入字符 
            if (token1.type === "attribute.name.html" && token2.type === "" && token3.type === "tag.html") {
                return createPropCompletions(tagName, widgetCode, isExistWidgetCode);
            }

            //在属性 a="这里" 里面直接输入字符
            if ((token1.type === "" && token2.type === "delimiter.html" && token3.type === "attribute.name.html") ||
                (token1.type === "attribute.name.html" && token2.type === "" && token3.type === "delimiter.html")) {
                return createPropValueCompletions(tagName, substringText, "", widgetCode);
            }

            // 在属性后面输入如  eg:<button a="b" 这里
            if ((token1.type === "attribute.value.html" &&
                token2.type === "delimiter.html" &&
                token3.type === "attribute.name.html") ||
                (token1.type === "attribute.name.html" &&
                    token2.type === "" &&
                    token3.type === "attribute.value.html")) {

                return createPropCompletions(tagName, widgetCode, isExistWidgetCode);
            }
        }

        return createVuiCompletions(isTriggerByBrackets);
    }

    /**
     * vui 标签自动完成数据
     * @param {是否 < 触发的} isFromBrackets 
     * @returns {标签自动完成数据} 
     */
    function createVuiCompletions(isFromBrackets) {

        var datas = vuiDataSourceHandler.vuiJsonData();
        var comletions = new Array(datas.length);
        var index = 0;
        var existCodes = getExistWidgetCodes();

        $.each(datas,
            function (vdata, tmpData) {
                var insertText;
                var code = newWidgetCode(vdata, existCodes);
                var soruce = tmpData.autoCompleteSource;
                if (soruce) {
                    soruce = replaceJsonChar(soruce);
                    soruce = String.format(soruce, code);
                    if (isFromBrackets)
                        soruce = soruce.substring(1);
                    insertText = soruce;
                } else {
                    insertText = (isFromBrackets ? "" : "<") + vdata;
                    //元数据存在widget-code才加上
                    if (tmpData.attributes && tmpData.attributes["widget-code"])
                        insertText += ' widget-code="' + code + '"';

                    insertText += "></" + vdata + ">";
                }
                var vui = {
                    label: " " + vdata,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    documentation: tmpData.label,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    insertText
                };
                if ("true".equalIgnoreCase(tmpData.triggerSuggest)) {
                    vui.command = { id: 'editor.action.triggerSuggest', title: 123 }
                }
                comletions[index] = vui;
                index++;
            });
        return {
            suggestions: comletions
        }
    }

    /**
     * vui 属性自动完成数据
     * @param {标签} tag 
     * @param {是否已经包含了widgetCode} isExistWidgetCode 
     * @returns {ui 属性自动完成数据} 
     */
    function createPropCompletions(tag, widgetCode, isExistWidgetCode) {
        var props = new Array();
        var index = 0;

        var vuiData = getVuiData(tag);
        var eixstEvenCodes = getExistEventCodes();
        if (vuiData && vuiData.attributes) {
            $.each(vuiData.attributes,
                function (attr, propData) {
                    if (attr === "widget-code")
                        return;

                    var insertText;
                    if (propData.insertText && propData.insertText !== "") {
                        insertText = replaceJsonChar(propData.insertText);
                    } else {
                        insertText = attr + '="' + replaceJsonChar(propData.defaultValue) + '$0"';
                    }

                    if (propData.valueType === "event") {
                        var tmp = (widgetCode + "_" + attr).replace(/-/g, "");
                        insertText = "v-on:" + String.format(insertText, newEventName(tmp, eixstEvenCodes));
                        if (IsDevEditorMode()) {
                            insertText = insertText.replace(/handleEvent/, "\\$emit");
                        }
                    }
                    var prop = {
                        label: " " + attr,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        documentation: replaceJsonChar(propData.description),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        insertText
                    };

                    if ("vui-chart".equalIgnoreCase(tag) && "chartSettings".equalIgnoreCase(attr)) {
                        prop.command = {
                            id: vuiChartHandler.getOpenChartCmdId(),
                            title: "打开图表设计"
                        }
                    } else if ("true".equalIgnoreCase(propData.triggerSuggest)) {
                        prop.command = { id: 'editor.action.triggerSuggest', title: 123 };
                    }

                    props[index] = prop;
                    index++;
                });
        }

        var commons = vuiDataSourceHandler.vuiCommonPropsJsonData();
        if (commons) {
            $.each(commons,
                function (com, p) {
                    var insertValue = "";
                    if (p.insertText && p.insertText !== "") {
                        if (com === "v-on:click") {
                            var insertText = p.insertText;
                            if (IsDevEditorMode()) {
                                insertText = insertText.replace(/handleEvent/, "\\$emit");
                            }
                            var tmp = (widgetCode + "_click").replace(/-/g, "");
                            insertValue = String.format(replaceJsonChar(insertText),
                                newEventName(tmp, eixstEvenCodes));
                        } else {
                            insertValue = replaceJsonChar(p.insertText);
                        }
                    }
                    if (insertValue === "")
                        insertValue = com + "=\"${1:}\" ";

                    var propCommon = {
                        label: " " + com,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        documentation: com,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        insertText: insertValue
                    };
                    if ("true".equalIgnoreCase(p.triggerSuggest)) {
                        propCommon.command = { id: 'editor.action.triggerSuggest', title: 123 }
                    }
                    props[index] = propCommon;
                    index++;
                });
        }

        if (!isExistWidgetCode) {
            props.push(getWidgetCodeProperty(tag));
        }
        return {
            suggestions: props
        }
    }

    /**
     * 获取属性值自动完成数据
     * @param {html片段} htmlText 
     * @param {补充} insertSupplement
     * @param {widgetCode} widgetCode
     * @returns {} 
     */
    function createPropValueCompletions(tagName, htmlText, insertSupplement, widgetCode) {
        //var tagMatch = htmlText.match(tagStart);
        var propName = getLastProp(htmlText + "\"");
        if (propName) {
            var options = null;
            var propData = getVuiPropData(tagName, propName);
            if (propData) {
                options = getValueOptions(propData.valueOptions);
            } else { //如果当前属性在vui标签中没有就找公共的
                var commonOptions = vuiDataSourceHandler.vuiCommonPropsJsonData();
                if (commonOptions && commonOptions[propName]) {
                    options = getValueOptions(commonOptions[propName].source);
                    //如果是事件，则new一个propData，这个为了下面生成call
                    if (commonOptions[propName].source === "eventmode")
                        propData = { valueType: "event" };
                    else if (commonOptions[propName].source.indexOf("resources") !== -1) {
                        propData = { valueType: "resources" };
                    }
                } else if (propName === "src") {
                    options = getValueOptions("devResources");
                    propData = { valueType: "resources" };
                }
            }

            //如果是事件,生成js中的call('aa')
            if (propData && propData.valueType === "event" && options) {
                if (IsDevEditorMode()) {
                    options.splice(0, options.length);
                    options.push("\\$emit('%1')");
                } else {
                    var functions = jsUtil.getAllJsFunctions();
                    if (functions) {
                        $.each(functions,
                            function (index, data) {
                                options.push(String.format("call('%1')", data));
                            });
                    }
                }
            }

            var props = [];
            if ("vui-chart".equalIgnoreCase(tagName) && "chartSettings".equalIgnoreCase(propName)) {
                props.push({
                    label: "打开图表设计",
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    insertText: "$0",
                    command: {
                        id: vuiChartHandler.getOpenChartCmdId(),
                        title: "图表设计"
                    }
                });
            }

            if (options && options.length > 0) {
                $.each(options,
                    function (index, option) {
                        if (insertSupplement && insertSupplement !== "") {
                            option = String.format(insertSupplement, option);
                        } else {
                            if (propData) {
                                if (propData.valueType === "event") {
                                    var split = propName.split(':');
                                    var tmp = (widgetCode + "_" + split[split.length - 1]).replace(/-/g, "");
                                    option = String.format(option, newEventName(tmp, getExistEventCodes()));
                                }
                            } else if (propName === "v-for") {
                                option = "rd in " + option;
                            }
                        }
                        var propCommon = {
                            label: option,
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            documentation: option,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            insertText: option
                        };
                        //if (propName === "v-for") {
                        //    propCommon.insertText = { value: "${1:rd} in " + option };
                        //}
                        props[index] = propCommon;
                    });
            }

            if (props.length > 0)
                return {
                    suggestions: props
                }

            if (propName.toLowerCase() === "widget-code") {
                return {
                    suggestions: [getWidgetCodePropertyValue(tagName, null)]
                }
            }
        }

        //如果找不到这个属性
        return {
            suggestions: []
        }
    }

    function registerCodeLensProvider() {

    }

    return {
        autoCompleteHandler: autoCompleteHandler,
        getVuiData: getVuiData,
        getVuiPropData: getVuiPropData,
        replaceJsonChar: replaceJsonChar,
        getExistWidgetCodes: getExistWidgetCodes,
        getValueOptions: getValueOptions,
        getExistEventCodes: getExistEventCodes,
        getLastProp: getLastProp,
        getExistWidgetCodesWithSources: getExistWidgetCodesWithSources,
        registerCodeLensProvider: registerCodeLensProvider
    }
})();