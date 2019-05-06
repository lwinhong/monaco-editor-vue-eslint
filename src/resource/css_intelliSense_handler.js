
var cssIntelliSenseHandler = (function () {

    function autoCompleteHandler(model, position) {

        //var lineCount = model.getLineCount();
        var startLineNumber = 1;
        if (position.lineNumber > 100) {
            startLineNumber = position.lineNumber - 100;
        }
        //获取开始倒光标位置的文本
        var text = model.getValueInRange({
            startLineNumber: startLineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column
        });

        var textTrimed = $.trim(text);
        var substringText = textTrimed.substring(textTrimed.lastIndexOf(";"));
        //获取开始倒光标位置的文本tokens
        var tokens = monaco.editor.tokenize(substringText, "css");

        var megerTotens = new Array();
        $.each(tokens,
            function (index, obj) {
                megerTotens = megerTotens.concat(obj);
            });
        var token1 = megerTotens[megerTotens.length - 1];
        if (megerTotens.length > 2) {
            var token2 = megerTotens[megerTotens.length - 2];

            if (/background\s{0,}:/gi.test(substringText) || /background-image\s{0,}:/gi.test(substringText)) {
                //第一个
                if ((token1.type === '' && token2.type === 'delimiter.bracket.css')) {
                    return getUrlResourcesComps();
                }

                if (token1.type === 'delimiter.css' || (token1.type === '' && token2.type === 'delimiter.css')
                    || (token1.type === 'attribute.value.css') || token1.type === 'tag.css') {
                    return getUrlResourcesComps();
                }
            }
        }
        return [];
    }


    /**获取url资源自动完成数据
     * @return {urls}
     */
    function getUrlResourcesComps() {
        var urls = [];
        var resources = vuiDataHandler.getValueOptions("resources");
        if (resources) {
            var buildItems = function (sources, opFormat) {
                $.each(sources,
                    function (i, data) {
                        var result = String.format(opFormat, data);
                        urls.push({
                            label: " " + result,
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            documentation: result,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            insertText:  result
                        });
                    });
            };

            var res = "url(\"${getResource('" + currentComponent + "',%1)}\")";
            buildItems(resources, res);

            if (IsDevEditorMode()) {
                var devRes = "url(\"%1\")";
                resources = vuiDataHandler.getValueOptions("devResources");
                if (resources)
                    buildItems(resources, devRes);
            }

        }
        return  {
            suggestions: urls
        }
    }

    return {
        autoCompleteHandler: autoCompleteHandler
    };
})();
