/**
 * 保存相关处理
 */
var saveHandler = (function () {

    /********************************************** js 和 html 注释去除相关处理***************************************************/

    var htmlCommentReg = /\<\!\-\-[\s\S]*?\-\-\>/g;
    var jsCommentReg = /("([^\\\"]*(\\.)?)*")|('([^\\\']*(\\.)?)*')|(\/{2,}.*?(\r|\n|$))|(\/\*(\n|.)*?\*\/)/g;

    /**
     * html注释
     * @param {} html 
     * @returns {} 
     */
    function removeComments(html) {
        if (!html)
            return html;
        return html.replace(htmlCommentReg, "");
    }

    /**
     * 去除js注释
     * @param {} script 
     * @returns {} 
     */
    function removeJsComments(script) {
        if (!script)
            return script;
        return script.replace(jsCommentReg,
            function (word) {
                // 去除注释后的文本 
                return /^\/{2,}/.test(word) || /^\/\*/.test(word) ? "" : word;
            });
    }

    /********************************************** js 和 html 注释去除相关处理 END***************************************************/


    return {
        removeComments: removeComments,
        removeJsComments: removeJsComments
    };
})();

/**
 * js 相关处理
 */
var jsUtil = (function () {

    /**
     * 获取js行数名称
     * @param {} script 
     * @returns {} 
     */
    function getJsFunctionName(script) {
        if (!script)
            return null;

        var newFunction = /(var)(\s+)((?:[a-z][a-z0-9_]*))(\s{0,})(=)(\s{0,})(new)(\s+)(Function)/gi;
        var normalFunction = /(function)(\s+)((?:[a-z][a-z0-9_]*))/gi;
        var varFunction = /(var)(\s+)((?:[a-z][a-z0-9_]*))(\s{0,})(=)(\s{0,})(function)/gi;

        var index = 0;
        var functions = [];
        var regexs = [newFunction, normalFunction, varFunction];
        var value = saveHandler.removeJsComments(script);

        $.each(regexs, function (j, regex) {
            while (true) {
                var results = regex.exec(value);
                if (results) {
                    functions[index] = results[3].trim();
                    index++;
                } else {
                    break;
                }
            }
        });

        return functions;
    }

    /**
     * 获取所有js函数名称
     * @returns {} 
     */
    function getAllJsFunctions() {
        var editors = [editorData[editorKey.javascript], editorData[editorKey.moduleJavaScript]];
        var result = [];
        $.each(editors,
            function (i, editor) {
                if (editor && editor.editor) {
                    var functions = getJsFunctionName(editor.editor.getValue());
                    if (functions) {
                        result = result.concat(functions);
                    }
                }
            });
        return result;
    }

    /**
    * 获取 包含exports的模块化js 
    * @returns {} 
    */
    function getModuleJsWithExports(value) {
        if (!value) {
            var editor = editorData[editorKey.moduleJavaScript].editor;
            if (editor) {
                value = editor.getValue();
            }
        }

        if (!value)
            return value;

        value = value.trim();
        var functions = getJsFunctionName(value);
        if (functions && functions.length > 0) {
            var format = "exports.%1=%1;";
            var result = "";
            $.each(functions,
                function (i, data) {
                    result += String.format(format, data);
                });
            value += (value.endsWith(";") ? " \n " : "; \n ") + result;
        }
        return value;
    }

    /**
     * 去除模块js中的exports
     * @param {} moduleJs 
     * @returns {} 
     */
    function removeModuleJsExports(moduleJs) {
        if (!moduleJs)
            return moduleJs;

        var removeExportReg = /exports\s{0,}.\s{0,}(([^<](\w|\s)*))\s{0,}=\s{0,}(([^<](\w|\s)*))\s{0,};/gi;
        return moduleJs.replace(removeExportReg, "");
    }

    return {
        getAllJsFunctions: getAllJsFunctions,
        getModuleJsWithExports: getModuleJsWithExports,
        getJsFunctionName: getJsFunctionName,
        removeModuleJsExports: removeModuleJsExports
    };
})();