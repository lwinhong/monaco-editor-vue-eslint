var scriptIntelliSensehandler = (function () {
    function autoCompleteHandler(model, position) {

        var lineContont = model.getLineContent(position.lineNumber);
        lineContont = lineContont.substring(0, position.column);
        var tokens = monaco.editor.tokenize(lineContont, "javascript");

        var lineTokens = tokens[position.lineNumber - 1];
        if (lineTokens && lineTokens.length > 1) {
            var last1 = lineTokens[lineTokens.length - 1];
            var last2 = lineTokens[lineTokens.length - 2];
            if (last1.type === "" && last2.type === "keyword.js" || last2.type === "keyword.js") {
                var text = $.trim(lineContont);
                if (text.endsWith("from")) {
                    return buildItems();
                }
            }
        }
        return  {
            suggestions: []
        } 
    }

    function buildItems() {
        var sources = vuiDataSourceHandler.getScriptResources();
        var urls = new Array();
        $.each(sources, function (i, data) {
            urls.push({
                label: " " + data,
                kind: monaco.languages.CompletionItemKind.Keyword,
                documentation: data, 
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                insertText:   "'" + data + "';"
            });
        });
        return  {
            suggestions: urls
        } 
    }

    return { autoCompleteHandler: autoCompleteHandler }
})();
