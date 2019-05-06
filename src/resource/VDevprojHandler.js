
var vdevprojHandler = (function () {
    //加载默认的页签
    function loadDevEditorPage() {
        loadPageCommon(editorKey.template, "template", String.format(templateFormat, 'Template'));
        loadPageCommon(editorKey.script, "script", String.format(templateFormat, 'Script'));
        //loadPageCommon(editorKey.style, "style", String.format(templateFormat, 'Style'));
        loadPageCommon(editorKey.themeLess, "theme.less", String.format(templateFormat, 'ThemeLess'));
        loadPageCommon(editorKey.varLess, "var.less", String.format(templateFormat, 'VarLess'));
    }

    function loadDevMonacoEditor() {
        loadEditor(editorKey.template, 'html', jsonValue ? jsonValue.Template : '');
        loadEditor(editorKey.script, 'javascript', jsonValue ? jsonValue.Script : '');

        if (jsonValue && jsonValue.Style) {
            loadPageCommon(editorKey.style, "style", String.format(templateFormat, 'Style'));
            loadEditor(editorKey.style, 'css', jsonValue.Style);
        }
        loadEditor(editorKey.themeLess, 'less', jsonValue ? jsonValue.ThemeLess : '');
        loadEditor(editorKey.varLess, 'less', jsonValue ? jsonValue.VarLess : '');
    }

    return {
        loadDevEditorPage: loadDevEditorPage,
        loadDevMonacoEditor: loadDevMonacoEditor
    }
})();