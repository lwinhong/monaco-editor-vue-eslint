const reg = /(@[\w-_]+)\s*\:/gi

const themeVarHandler = editor => {

    if (!editor) {
        //throw Error('必须提供 monaco-editor 示例.')
        console.log('themeVarHandler: 必须提供 monaco-editor 示例.')
        return
    }

    const monaco = window.monaco
    if (!monaco) {
        //throw Error('monaco-editor 还没加载完成.')
        console.log('themeVarHandler: monaco-editor 还没加载完成.')
        return
    }

    const newCompletionItem = (label, documentation, insertText) => {
        var prop = {
            label: label,
            kind: monaco.languages.CompletionItemKind.Variable,
            documentation: documentation,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            insertText
        }
        return prop
    }

    /**
     * 添加var变量提示数据
     * @param {智能提示集合} items 
     */
    const appendVarItems = items => {
        if (editorData.hasOwnProperty(editorKey.varLess) && editorData[editorKey.varLess].model) {
            var varHtml = editorData[editorKey.varLess].model.getValue()
            varHtml = saveHandler.removeJsComments(varHtml)
            while (true) {
                const results = reg.exec(varHtml)
                if (results) {
                    var prop = newCompletionItem(results[1], results[1], results[1])
                    items.push(prop)
                    continue
                }
                break
            }
        }
    }

    /**
     * 添加dev 的share 资源提示数据
     * @param {智能提示集合} items 
     */
    const applendDevResrouceItems = items => {
        var props = vuiDataSourceHandler.vuiPropValuesJsonData();
        if (props && props.hasOwnProperty("devResources")) {
            var resources = props["devResources"]
            if (resources) {
                $.each(resources, function (i, d) {
                    var prop = newCompletionItem(d, d, d)
                    items.push(prop)
                })
            }
        }
    }

    /**
     * 添加构件中全局主题变量提示数据
     * @param {智能提示集合} items 
     */
    const appendComponentThemeVars = items => {
        var data = vuiDataSourceHandler.getComponentThemeVarData()
        if (data) {
            $.each(data, function (i, d) {
                var prop = newCompletionItem(d, d, d)
                items.push(prop)
            })
        }
    }

    const provideCompletionItems = (model, position) => {

        var lineContent = model.getLineContent(position.lineNumber)
        var trimedContent = lineContent.substring(0, position.column - 1)
        // var tokens = monaco.editor.tokenize(trimedContent, 'less')
        var items = []

        //简单的判断当前光标是否以@结尾
        if (trimedContent && trimedContent.trim().endsWith('@')) {
            //VarLess变量
            appendVarItems(items)
            //dev资源变量
            applendDevResrouceItems(items)
            //构件中全局主题变量
            appendComponentThemeVars(items)
        }

        return  {
            suggestions: items
        }  
    }

    monaco.languages.registerCompletionItemProvider("less", {
        triggerCharacters: ["@"],
        provideCompletionItems: provideCompletionItems
    })
}

export default themeVarHandler