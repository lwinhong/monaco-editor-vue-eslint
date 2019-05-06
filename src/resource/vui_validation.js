var warningData = [];
var dataForShow = [];

/**
 * 验证用户输入
 * @param {是否显示头部提示信息} boolShowTopMsg
 * @returns {验证通过true 失败 false} 
 */
function validationAll(boolShowTopMsg, editorCode, saveCallBack) {
    //没有指定要验证的编辑器就全部校验
    if (!editorCode) {
        vm.errorData.splice(0, vm.errorData.length); //清空数组 
        warningData.splice(0, warningData.length);

        htmlValidationHandler.checkHtml();
        cssValidationHandler.cssValidata();
        jsValidationHandler.jsValidata();
    } else {
        //校验指定的编辑器之前删除该编辑器之前校验的数据
        for (var i = vm.errorData.length - 1; i >= 0; i--) {
            var data = vm.errorData[i];
            if (data.moduleKey === editorCode) {
                vm.errorData.splice(i, 1);
                warningData.splice(i, 1);
            }
        }

        if (editorCode === editorKey.html || editorCode === editorKey.template) {
            htmlValidationHandler.checkHtml(editorCode);
        } else if (editorCode === editorKey.css || editorCode === editorKey.moduleCss
            || editorCode === editorKey.style || editorCode === editorKey.themeLess
            || editorCode === editorKey.varLess) {
            cssValidationHandler.cssValidata(editorCode);
        }
        else if (editorCode === editorKey.javascript || editorCode === editorKey.moduleJavaScript
            || editorCode === editorKey.script) {
            jsValidationHandler.jsValidata(editorCode);
        }
    }

    executeCmdWithValue(cmdData.setErrorState, vm.errorData.length.toString());

    if (vm.errorData.length > 0) {
        if (saveAndClose === saveCallBack || saveEditor === saveCallBack)
            showError(true, "", boolShowTopMsg, saveCallBack);
        return false;
    } else {
        showError(false);
    }
    return true;
}

/**
 * 显示错误信息
 * @param {} show 
 * @param {} msg 
 * @returns {} 
 */
function showError(show, msg, boolShowTopMsg, saveCallBack) {
    var fs = errorViewHandler.errorViewJq();
    if (show) {
        fs.css("bottom", 0);
    } else {
        fs.css("bottom", "-100%");
    }
    if (boolShowTopMsg) {
        vm.showSavedErrorMessage(saveCallBack, saveCallBack !== saveAndClose);
    }
}

/**
 * 设置选中页签
 * @param {} editorName 
 * @returns {} 
 */
function setTabIndex(editorName) {
    if (vm) {
        vm.selectedIndex = editorName;
        vm.handleClose();
    }
}

/**
 * 定位错误
 * @param {} row 
 * @param {} index 
 * @returns {} 
 */
function localError(row, index) {
    if (row) {
        var editor = editorData[row.moduleKey];

        if (editor && editor.editor) {
            editor.editor.revealPositionInCenter({ lineNumber: row.range.endLineNumber, column: row.range.endColumn });
            editor.editor.setSelection(row.range);
        }
        setTabIndex(row.moduleKey);
        setEditorFocusDelay(editor.editor);
    }
}

/**
 * 添加错误提示信息
 * @param {错误描述} desc 
 * @param {位置 range} position 
 * @param {模块} module 
 * @returns {无} 
 */
function addErrorInfo(desc, position, module, ruleUrl, ruleId) {
    if (!vm)
        return;

    addVerifyData(vm.errorData, desc, position, module, ruleUrl, ruleId, "error")
}

function addVerifyData(dataArray, desc, position, module, ruleUrl, ruleId, severity) {
    if (!dataArray)
        return;

    dataArray.push({
        "desc": desc,
        "row": position.startLineNumber,
        "column": position.endColumn,
        "moduleName": (function () {
            for (var i = 0; i < vm.tabs.length; i++) {
                var tab = vm.tabs[i];
                if (tab.key === module)
                    return tab.value;
            }
            return module;
        })(),
        "moduleKey": module,
        "range": position,
        "ruleUrl": ruleUrl,
        "ruleId": ruleId,
        "severity": severity
    });
}

/**
 * 检查指定的编辑器中错误，并把错误信息添加到错误列表
 * @param {编辑key集合} editorKeys 
 * @returns {检查结果 true/false} 
 */
function checkAndAddErrorInfo(editorKeys) {
    var editors = editorKeys;
    var pass = true;
    for (var i = 0; i < editors.length; i++) {
        var editorName = editors[i];
        var editor = editorData[editors[i]];
        if (editor && editor.model && editor.model._decorations) {
            $.each(editor.model._decorations, function (index, d) {
                if (d.options.className === "squiggly-error") {
                    pass = false;
                    addErrorInfo(d.options.hoverMessage.value,
                        d.range, editorName);
                }
            });
        }
    }
    return pass;
}

/**
 * 验证html输入
 */
var htmlValidationHandler = (function () {

    var widgetCodeReg = /^(?!_)(?!.*?_$)[A-Za-z][a-zA-Z0-9_]*$/i;
    var oldDecorations = [];

    /**
    * 检查并收集重复的widgetcode
    * @returns {} 
    */
    function checkAndGetRepeatWidgetCode(existWidgetCodes) {

        var repeatCodes = new Array();

        if (existWidgetCodes) {

            //1.判断在当前页面是否重复
            $.each(existWidgetCodes, function (code, source) {
                if (source && source.length > 1 && code)
                    repeatCodes.push(code);
            });

            if (repeatCodes.length > 0) {
                return repeatCodes;
            }

            //2.判断在当前窗体是否重复
            var existControlCodes = vuiDataSourceHandler.existControlCodeJsonData();
            if (existControlCodes) {
                $.each(existWidgetCodes, function (code, source) {
                    if ($.inArray(code, existControlCodes) !== -1) {
                        repeatCodes.push(code);
                    }
                });
            }
        }
        vuiDataHandler.getExistEventCodes(true);
        vuiDataHandler.getExistWidgetCodes(true);
        return repeatCodes.length > 0 ? repeatCodes : null;
    }

    /**
     * 验证匹配的信息是否有效
     * 这里用来确定匹配的是否为注释的信息
     * @param {} model 
     * @param {} editor 
     * @param {} startLineNumber 
     * @param {} startColumn 
     * @returns {} 
     */
    function validateMathResult(tokens, startLineNumber, startColumn) {
        if (tokens && tokens.length > startLineNumber) {
            var targetToten = tokens[startLineNumber - 1];
            for (var j = targetToten.length - 1; j >= 0; j--) {
                var token = targetToten[j];
                if (token.offset <= startColumn &&
                    (token.type === "comment.html" || token.type === "comment.content.html")) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * 检查widgetCode是否重复
     * @returns {} 
     */
    function checkWidgetCode() {

        var existWidgetCodes = vuiDataHandler.getExistWidgetCodesWithSources();
        var editor = editorData[IsDevEditorMode() ? editorKey.template : editorKey.html];
        var newDecorations = new Array();

        var tokens;
        let html = editor.model.getValue();
        var getTokens = function () {
            if (!tokens)
                tokens = monaco.editor.tokenize(html, "html");
            return tokens;
        };

        //塞Decorations
        var pushDecorations = function (range, hoverMsg) {
            newDecorations.push({
                range: range,
                options: {
                    inlineClassName: "squiggly-error",
                    hoverMessage: { value: hoverMsg },
                    afterContentClassName: "inline-widgetcode-illegal",
                    linesDecorationsClassName: "lineDecoration-error"
                }
            });
        };

        //匹配错误信息
        var matcheAndAddError = function (code, hoverMsg, error) {
            var isAdded = false;
            var setErrorInfo = function (matheSource) {
                var matches = editor.model.findMatches(matheSource, true, false, false);
                $.each(matches,
                    function (index1, match) {
                        var r = match.range;
                        if (validateMathResult(getTokens(), r.startLineNumber, r.startColumn)) {
                            pushDecorations(r, hoverMsg);
                            addErrorInfo(error, r, editor.key);
                            isAdded = true;
                            //return false;
                        }
                        //return true;
                    });
            };
            if (code && Array.isArray(code) && code.length > 0) {
                var dist = code.distinct1();
                $.each(dist, function (i, o) {
                    setErrorInfo(o);
                });
            } else {
                setErrorInfo(code);
            }

            return isAdded;
        };


        //widgetCode不合法的
        $.each(existWidgetCodes, function (code, source) {
            var hoverMessage = "";
            var errorMessage = "";
            var isPass = true;
            //编码空
            if (!code || code.trim() === "") {
                hoverMessage = errorMessage = "无效的编码，编码不能为空";
                isPass = false;
            }
            else if (code.length > 64) {
                var tmp = "无效的编码%1，编码不能超过64个字符";
                hoverMessage = String.format(tmp, "");
                errorMessage = String.format(tmp, "[" + code + "]");
                isPass = false;
            } else {
                if (!widgetCodeReg.test(code)) {
                    var tmp1 = "无效的编码%1，只能包含字母(A-Z,a-z)、数字(0-9)、下划线(_)。\r\n只能以字母开头，且不能以下划线结尾。";
                    hoverMessage = String.format(tmp1, "");
                    errorMessage = String.format(tmp1, "[" + code + "]");
                    isPass = false;
                }
            }

            if (!isPass) {
                matcheAndAddError(source, hoverMessage, errorMessage);
            }
        });


        //widgetCode验证重复
        var repearResult = checkAndGetRepeatWidgetCode(existWidgetCodes);
        if (repearResult && repearResult.length > 0) {

            var errorMsg = "widget-code [%1] 重复";
            $.each(repearResult, function (index, code) {
                matcheAndAddError(existWidgetCodes[code], "编码重复,请修正", String.format(errorMsg, code));
            });
        }


        let htmlparser = window.vdk.default.htmlparser
        if (html) {
            let hasScriptTag = false;
            let parser = new htmlparser.Parser({
                onopentag: (tagName, attrs) => {
                    if (tagName == "script") {
                        hasScriptTag = true
                    }
                }
            }, { decodeEntities: true, lowerCaseTags: false });
            parser.write(html);
            parser.end();
            if (hasScriptTag)
                matcheAndAddError('<script', 'template下不能有script标签', 'template下不能有script标签');
        }

        //将错误装饰添加编辑器
        if (newDecorations.length > 0) {
            oldDecorations = editor.editor.deltaDecorations(oldDecorations, newDecorations);
            return false;
        } else {
            oldDecorations = editor.editor.deltaDecorations(oldDecorations, []);
            return true;
        }

    }

    /**
     * 检查用户输入的template格式
     * @returns {} 
     */
    function checkTemplate() {
        if (IsDevEditorMode()) {
            const editor = editorData[editorKey.template];
            if (editor && editor.model) {
                //  旧的校验template v-if else的，现在用下面的 vm.invalidate(editor.editor);
                //var result = executeCmdWithValue(cmdData.checkTemplate, editor.model.getValue());
                //if (result) {
                //    addErrorInfo(result, new monaco.Range(0, 0, 0, 1), editor.key);
                //}
                vm.invalidate(editor, editor.editor);
            }
        }
    }

    /**
     * 检查html输入合法性
     * @returns {} 
     */
    function checkHtml() {
        checkWidgetCode();
        if (IsDevEditorMode())
            checkTemplate();
    }

    return {
        checkWidgetCode: checkWidgetCode,
        checkTemplate: checkTemplate,
        checkHtml: checkHtml
    };
})();

/**
 * css相关校验
 */
var cssValidationHandler = (function () {

    var invalidateChar = ["'", '"', '(', ')', ' ', '~', '+'];
    var getErrorMessage = (source) => {
        return `文件资源：“${source}” 存在非法字符! 不能有空格、单双引号、+ 、~ 、( 、)`;
    };

    function findMatches(model, source, editorKey) {
        var matches = model.findMatches(source, true, false, false);
        if (matches) {
            matches.forEach(match => {
                var range = match.range;
                addErrorInfo(getErrorMessage(source), range, editorKey);
            });
        }
    }

    function cssValidata(editorCode) {

        var editors = editorCode ? [editorCode] : [editorKey.css, editorKey.moduleCss, editorKey.style, editorKey.themeLess, editorKey.varLess];
        var passCss = checkAndAddErrorInfo(editors);

        var passDevResources = true;
        if (!passCss || !IsDevEditorMode())
            return passCss;

        var resources = vuiDataHandler.getValueOptions("devResources");
        if (resources) {
            editors = editorCode ? [editorCode] : [editorKey.themeLess, editorKey.varLess];
            for (let i = 0; i < editors.length; i++) {
                editorCode = editors[i];
                resources.forEach(resource => {
                    for (let index = 0; index < resource.length; index++) {
                        var c = resource[index];
                        if ($.inArray(c, invalidateChar) !== -1) { //非法资源名称
                            findMatches(editorData[editorCode].model, resource, editorCode);
                            passDevResources = false;
                            break;
                        }
                    }
                });
            }
        }

        return passCss && passDevResources;
    }

    return {
        cssValidata: cssValidata
    };
})();

/**
 * js相关校验
 */
var jsValidationHandler = (function () {
    function jsValidata() {
        var scriptEditor = editorData[editorKey.script];
        if (scriptEditor && scriptEditor.model) {
            vm.invalidate(scriptEditor, scriptEditor.editor, function () {
                var editors = [editorKey.javascript, editorKey.moduleJavaScript, editorKey.script];
                checkAndAddErrorInfo(editors);
            });
        }
        // var editors = [editorKey.javascript, editorKey.moduleJavaScript, editorKey.script];
        // return checkAndAddErrorInfo(editors);
    }
    return { jsValidata: jsValidata };
})();

var errorViewHandler = (function () {

    var errorViewJq = function () {
        return $("#foot-statusbar");
    }

    var fixedError = false;
    var fixedOrFlow = function () {
        var errorView = $("#fixedOrFlowImg");
        if (fixedError) {
            fixedError = false;
            errorView.attr('src', '../Images/flow.png');
        } else {
            fixedError = true;
            errorView.attr('src', '../Images/fixed.png');
        }
    }

    var getState = function () {
        var errorView = errorViewJq();
        return {
            "fixed": fixedError,
            "bottom": errorView.css("bottom"),
            "height": errorView.height()
        };
    }
    var setState = function (value) {
        if (value) {
            setFixed(value.fixed);
            var errorView = errorViewJq();
            errorView.css("bottom", value.bottom);
            errorView.css("height", value.height);
            $(".ivu-table-wrapper").css("height", value.height - 3);
            $(".ivu-table-body").css("height", value.height - 28);
        }
    }

    var closeAction = function () {
        showError(false);
    }
    var getetFixed = function () {
        return fixedError;
    }

    function setFixed(value) {
        fixedError = !value;
        fixedOrFlow();
        fixedError = value;
    }

    return {
        closeAction: closeAction,
        fixedOrFlow: fixedOrFlow,
        GetFixed: getetFixed,
        SetFixed: setFixed,
        getState: getState,
        setState: setState,
        errorViewJq: errorViewJq
    };

})();