var jsonValue = null;
var editorWordWrap = "off";
var editorMinimapEnabled = false;
var isEditorLoaded = false;
var isGolobalEditorLoaded = false;
var editorTheme = "vs";
var editorMode = "default";
var isAnyValueChanged = false;
var winformToken = "";
var isHostFormClosed = false;
var divFlag = "1";

var monaco;

//命令数据
var cmdData = {
    save: "Save", saveAndClose: "SaveAndClose", saveAs: "SaveAs", openPreview: "OpenPreview",
    openDevTool: "OpenDevTool", deploy: "Deploy",
    openDataSource: "OpenDataSource", openEvent: "OpenEvent", openImport: "OpenImport",
    editorChanged: "EditorChanged", onLoaded: "Loaded", reloadEvent: "ReloadEvent",
    mouseClick: "MouseClick", cursorPosition: "CursorPosition", f1Help: "F1Help", checkTemplate: "CheckTemplate",
    saveViewState: "SaveViewState", setErrorState: "SetErrorState", runBackup: "RunBackup", openValidateRule: "OpenValidateRule",
    editChart: "EditChart", showChartButton: "ShowChartButton", cacheChangedValue: "CacheChangedValue", openWidthExplorer: "OpenWidthExplorer"
};

//editor容器模板
var templateFormat = '<div id="container_%1" class="editor_container"></div>';

/*  工具箱拖拽相关
const templateFormat = '<div id="container_%1" class="editor_container" ondrop="drop(event)" ondragover="allowDrop(event)"></div>';
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    //ev.dataTransfer.setData("Text", ev.target.id);
    editorData["Html"].editor.focus();
}

function drop(ev) {
    ev.preventDefault();
    //var data = ev.dataTransfer.getData("Text");
    var a = editorData["Html"].editor.getTargetAtClientPoint(event.clientX, event.clientY);
    editorData["Html"].editor.executeEdits("",
        [{
            range: a.range,
            text: data
        }]
    );
}*/

//编辑器编码key、类型
var editorKey = {
    html: "Html", css: "Css", javascript: "JavaScript",
    moduleJavaScript: "ModuleJavaScript", moduleCss: "ModuleCss", template: "Template",
    script: "Script", style: "Style", themeLess: "ThemeLess", varLess: "VarLess"
};

//存放打开的编辑器的数据
var editorData = {
    JavaScript: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.javascript },
    Css: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.Css },
    Html: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.html },
    ModuleJavaScript: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.moduleJavaScript },
    ModuleCss: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.moduleCss },
    Template: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.template },
    Script: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.script },
    Style: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.style },
    ThemeLess: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.themeLess },
    VarLess: { model: null, editor: null, isRegChangeEvent: false, key: editorKey.varLess }
};

require.config({ paths: { 'vs': "dev/vs" } });
require.config({
    'vs/nls': {
        availableLanguages: {
            '*': "zh-cn"
        }
    }
});

(function () {
    var qs = getQueryString();
    if (qs) {
        if (qs["mode"])
            editorMode = qs["mode"];
        if (qs["token"])
            divFlag = qs["token"];
    }
})();

function testLoad() {
    var allValue = {
        Html: "",
        Css: "",
        JavaScript: "",
        ModuleJavaScript: "",
        ModuleCss: "",
        Template: "",
        Style: "",
        ThemeLess: "",
        VarLess: "",
        Script: ""
    };
    editorMode = "dev";
    vmonacoEditor = null;
    var json = JSON.stringify(allValue);
    loadEdtorFromWinform(json, editorWordWrap, editorMinimapEnabled);
    isEditorLoaded = true;
    onLoadCompleted();
    $('#fillMask').hide();
}

//留个winform加载编辑器的方法 参数1：json数据,参数2：是否换行，参数3：minimap
function loadEdtorFromWinform(value, wordWrap, minimapEnabled, theme) {

    console.log("loadEdtorFromWinform")
    editorMinimapEnabled = minimapEnabled;
    editorWordWrap = wordWrap;
    editorTheme = theme;
    try {
        if (value) {
            jsonValue = JSON.parse(value);

        }
    } catch (e) {
        console.log(e);
    }
    if (editorMode === "default") {
        vm.selectedIndex = editorKey.html;
        loadDefaultEditorPage();
        loadMonacoEditor();

        loadEditorGlobalPage();
    } else if (editorMode === "dev") {

        window.vdk.default.parseComponentVue(jsonValue);

        vm.selectedIndex = editorKey.template;
        vdevprojHandler.loadDevEditorPage();
        vdevprojHandler.loadDevMonacoEditor();
    }

    editorLayout();

    try {
        var restoreTabIndex = vuiDataSourceHandler.getTabIndexState();
        if (restoreTabIndex)
            vm.selectedIndex = restoreTabIndex;
    } catch (error) {
        console.log(error);
    }
    try {
        var errorState = vuiDataSourceHandler.getViewState("errorState");
        if (errorState)
            errorViewHandler.setState(errorState);
    } catch (error) {
        console.log(error);
    }
    $('#fillMask').hide();
    onLoadCompleted();
}

function sleep(delay) {
    var start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {
        continue;
    }
}

//加载默认的页签
function loadDefaultEditorPage() {
    loadPageCommon(editorKey.html, "HTML", String.format(templateFormat, 'Html'));
    loadPageCommon(editorKey.moduleCss, "模块Css", String.format(templateFormat, 'ModuleCss'));
    loadPageCommon(editorKey.moduleJavaScript, "模块JavaScript", String.format(templateFormat, 'ModuleJavaScript'));
}

//加载全局需要的页签
function loadEditorGlobalPage() {
    if (jsonValue) {
        if (jsonValue.Css && jsonValue.Css !== "") {
            loadPageCommon(editorKey.css, "全局Css", String.format(templateFormat, 'Css'));
        }
        if (jsonValue.JavaScript && jsonValue.JavaScript !== "") {
            loadPageCommon(editorKey.javascript, "全局JavaScript", String.format(templateFormat, 'JavaScript'));
        }
    }
}

//加载页签
function loadPageCommon(key, value, template) {
    if (vm && vm.tabs) {
        for (let index = 0; index < vm.tabs.length; index++) {
            const element = vm.tabs[index];
            if (element.key === key)
                return;
        }
        vm.tabs.push({ key: key, value: value, template: template });
    }
}

//加载默认的编辑器
function loadMonacoEditor() {
    loadEditor(editorKey.html, 'html', jsonValue ? jsonValue.Html : '');
    loadEditor(editorKey.moduleCss, 'css', jsonValue ? jsonValue.ModuleCss : '');
    loadEditor(editorKey.moduleJavaScript, 'javascript', jsonValue ? jsonValue.ModuleJavaScript : '');
}

//加载全局的编辑器
function loadMonacoGlobalEditor() {
    loadEditor(editorKey.css, 'css', jsonValue ? jsonValue.Css : '');
    loadEditor(editorKey.javascript, 'javascript', jsonValue ? jsonValue.JavaScript : '');
}


//加载编辑器
function loadEditor(key, language, value) {
    if (editorData.hasOwnProperty(key) && editorData[key].editor !== null) {
        editorData[key].editor.updateOptions(
            {
                wordWrap: editorWordWrap,
                minimap: { enabled: editorMinimapEnabled }
            });
        // editorData[key].editor.updateOptions({ minimap: { enabled: editorMinimapEnabled } });
        if (value)
            editorData[key].editor.setValue(value);
        //initDidChangeModelContentEvent(editorData[key]);
        return;
    }

    require(["vs/editor/editor.main"],
        function () {
            var container = document.getElementById("container_" + key);
            if (container) {
                var editorModel = monaco.editor.createModel(value, language);
                var editor = monaco.editor.create(container,
                    {
                        model: editorModel,
                        wordWrap: editorWordWrap,
                        minimap: { enabled: editorMinimapEnabled },
                        formatOnPaste: true,
                        mouseWheelZoom: true,
                        renderLineHighlight: "none",
                        showFoldingControls: "mouseover",
                        folding: true
                        //glyphMargin:true
                    });
                editorData[key].model = editorModel;
                editorData[key].editor = editor;
                initDidChangeModelContentEvent(editorData[key]);
                monaco.editor.setTheme(editorTheme);
                this.monaco = monaco;

                if (key.equalIgnoreCase("html") || key.equalIgnoreCase("template")) {
                    monaco.languages.registerHoverProvider("html", {
                        provideHover: hover.hoverHandler
                    });

                    // triggerCharacters: [" ", "<", "=", "\""],
                    monaco.languages.registerCompletionItemProvider("html", {
                        triggerCharacters: ["<", "=", "\""],
                        provideCompletionItems: vuiDataHandler.autoCompleteHandler
                    });

                    if (key.equalIgnoreCase("template")) {
                        vuiChartHandler.initOpenChartCommand(editor, editorModel);
                    }

                    window.vdk.default.emmetHTML(editor);
                } else if (key.equalIgnoreCase("css") || key.equalIgnoreCase("moduleCss") || key.equalIgnoreCase("style")) {
                    monaco.languages.registerCompletionItemProvider("css", {
                        triggerCharacters: [":"],
                        provideCompletionItems: cssIntelliSenseHandler.autoCompleteHandler
                    });
                } else if (key.equalIgnoreCase("Script")) {
                    monaco.languages.registerCompletionItemProvider("javascript", {
                        provideCompletionItems: scriptIntelliSensehandler.autoCompleteHandler
                    });
                }
                else if (key.equalIgnoreCase(editorKey.themeLess)) {
                    window.vdk.default.themeVar(editor);
                }
                editor.onMouseDown(function (e) {
                    if (vm)
                        vm.handleClose();
                    if (isEditorLoaded) {
                        executeCmdWithValue(cmdData.mouseClick, null);
                    }
                    if (errorViewHandler.GetFixed() === false)
                        showError(false);
                });
                editor.onDidChangeCursorPosition(function (e) {
                    updateRowColumn(e.position);
                });

                editor.addAction({
                    // An unique identifier of the contributed action.
                    id: 'openWidthExplorer-' + key,

                    // A label of the action that will be presented to the user.
                    label: '在资源管理器中打开',

                    // A precondition for this action.
                    precondition: null,

                    // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
                    keybindingContext: null,

                    contextMenuGroupId: 'navigation',

                    contextMenuOrder: 0,

                    // Method that will be executed when the action is triggered.
                    // @param editor The editor instance is passed in as a convinience
                    run: function (ed) {
                        executeCmd(cmdData.openWidthExplorer);
                        return null;
                    }
                });

                try {
                    const viewState = vuiDataSourceHandler.getViewState(key);
                    if (viewState) {
                        editor.restoreViewState(viewState);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        });
}

//设置自動换行
function setMonacoEditorWordWrap(wordWrap) {
    for (var prop in editorData) {
        if (editorData.hasOwnProperty(prop) && editorData[prop].editor) {
            editorData[prop].editor.updateOptions({ wordWrap: wordWrap });
        }
    }
}

//设置mini地图（args1:true/false）
function setMonacoEditorMiniMap(enabled) {
    for (var prop in editorData) {
        if (editorData.hasOwnProperty(prop) && editorData[prop].editor) {
            editorData[prop].editor.updateOptions({ minimap: { enabled: enabled } });
        }
    }
}

//插入文本到编辑器
function insertTextToEditor(value) {
    var editor = getSelectedEditorData(null);
    if (editor && editor.editor) {
        editor.editor.focus();

        var result = getVText(value);
        var position = editor.editor.getPosition();
        editor.editor.executeEdits("",
            [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: result
            }]
        );
    }
}

//获取当前选中的编辑器
function getSelectedEditorData(key) {
    //如果没有传key在使用当前选中的页签key
    if (!key) {
        key = vm.selectedIndex;// vm.tabs[vm.selectedIndex].key;
    }

    if (editorData.hasOwnProperty(key)) {
        return editorData[key];
    }
    return null;
}

//获取值
function getVText(value) {
    var result = value && value.length && value.length > 0 && value[0] + "";
    if (!!!result)
        result = "";
    return result;
}

//注释行
function commentLine() {
    fireEditorTrigger("editor.action.commentLine");
}

//格式化
function formatCode() {
    fireEditorTrigger("editor.action.formatDocument");
}

//打开搜索
function openSearchBox() {
    fireEditorTrigger("actions.find");
}

//触发编辑器的trigger
function fireEditorTrigger(action) {
    var editor = getSelectedEditorData(null);
    if (editor && editor.editor) {
        editor.editor.focus();
        editor.editor.trigger("", action);
    }
}

//设置编辑器焦点
function setEditorFocus() {
    var editor = getSelectedEditorData(null);
    if (editor && editor.editor)
        setEditorFocusByEditor(editor.editor);
}

//设置编辑器焦点
function setEditorFocusByEditor(editor) {
    if (editor)
        editor.focus();
}

//获取指定编辑器中的代码
function getEditValue(editorType) {
    if (editorData.hasOwnProperty(editorType)) {
        var editor = editorData[editorType].editor;
        if (editor) {
            var result = editor.getValue();
            if (vmonacoEditor)
                vmonacoEditor.getEditorValue(editorType, result);
        }
    }
}

//获取全部编辑器的代码
function getAllValue() {
    var allValue = {
        IsValueChanged: isAnyValueChanged,
        FormToken: winformToken
    };

    for (var prop in editorData) {
        if (editorData.hasOwnProperty(prop) && editorData[prop].editor) {
            allValue[prop] = editorData[prop].editor.getValue();
        }
    }
    var last = JSON.stringify(allValue); //将JSON对象转化为JSON字符
    return last;
}


//给编辑器赋值
function setEditValue(value, editorType) {
    if (editorType === undefined || editorType === "") {
        var selectedEditor = getSelectedEditorData();
        if (selectedEditor)
            editorType = selectedEditor.key;
    }
    if (editorData.hasOwnProperty(editorType)) {
        var editor = editorData[editorType].editor;
        if (editor) {
            var result = getVText(value);
            editor.setValue(result);
        }
    }
}

//加载完成
function onLoadCompleted() {
    //vm.vuiMenuData = vuiDataSourceHandler.getVuiListForMenu();

    executeCmdWithValue(cmdData.onLoaded, null);
    setEditorFocusDelay(null);
    //isEditorLoaded = true;
}

//下标改变
function onMonacoEditorIndexChanged() {
    if (!isEditorLoaded)
        return;
    var value = vm.selectedIndex;
    if (editorKey.template !== value)
        vuiChartHandler.showChartSettingwidget(false);
    executeCmdWithValue(cmdData.editorChanged, value);
    //setEditorFocusDelay(editorData[value].editor);//延时设置选中页签的焦点
}

//打开预览
function openPreview() {
    var result = saveEditor(true);
    if (!result) {
        return;
    }
    executeCmd(cmdData.openPreview);
}

var isSaved = false;
//保存
function saveEditor(isValidation) {
    isSaved = false;
    if (isValidation) {
        var result = validationAll(true, null, saveEditor);
        if (!result) {
            return false;
        }
    }

    runSaveViewState();
    executeCmd(cmdData.save);
    isSaved = true;
    return true;
}

//保存并关闭编辑器
function saveAndClose(isValidation) {
    if (isEditorLoaded) {
        if (isValidation) {
            var result = validationAll(true, null, saveAndClose);
            if (!result) {
                return;
            }
        }

        runSaveViewState();
        executeCmd(cmdData.saveAndClose);
    }
}

function runSaveViewState() {
    executeCmdWithValue(cmdData.saveViewState, saveViewState());
}

var saveViewState = function () {
    var allValue = {
        FormToken: winformToken,
        "selectedIndex": window.vm.selectedIndex,
        "errorState": errorViewHandler.getState()
    };

    for (var prop in editorData) {
        if (editorData.hasOwnProperty(prop) && editorData[prop].editor) {
            allValue[prop] = editorData[prop].editor.saveViewState();
        }
    }
    var last = JSON.stringify(allValue); //将JSON对象转化为JSON字符
    return last;
};

function saveAndDeploy() {
    if (confirm("是否确认保存设计器、窗体并部署到默认地址？")) {
        if (saveEditor(true)) {
            vm.deployMessgge();
            executeCmd(cmdData.deploy);
        }
    }
    setEditorFocusDelay();
}

//另存为
function saveAsEditor() {
    if (isEditorLoaded)
        executeCmd(cmdData.saveAs);
}

//打开devtool
function openDevTool() {
    executeCmdWithValue(cmdData.openDevTool, null);
}

//打开数据源
function openDataSource() {
    executeCmdWithValue(cmdData.openDataSource, null);
}

//打开事件
function openEvent() {
    executeCmdWithValue(cmdData.openEvent, null);
}

//打开导入
function openImport() {
    var value = vm.selectedIndex;
    executeCmdWithValue(cmdData.openImport, value);
}

//打开导出
function openExport() {
    executeCmd(cmdData.openExport);
}

//重新加载事件
function reloadEvent() {
    var result = saveEditor(true);
    if (!result) {
        return;
    }
    executeCmd(cmdData.reloadEvent);
}

/**
 * 更新行列信息
 * @param {} position 
 * @returns {} 
 */
function updateRowColumn(position) {
    executeCmdWithValue(cmdData.cursorPosition,
        position.lineNumber + "," + position.column);
}

function runBackup() {
    executeCmd(cmdData.runBackup);
}

//执行命令
function executeCmd(cmdId) {
    var value = getAllValue();
    return executeCmdWithValue(cmdId, value);
}

//执行命令
function executeCmdWithValue(cmdId, value) {
    if (vmonacoEditor && !isHostFormClosed) {
        var result = vmonacoEditor.vhtmlKeysCommand(cmdId, winformToken, value);
        return result;
    }
    return null;
}

function setReadOnly(readonly) {

    if (readonly !== undefined) {
        setSaveAndCloseVisible(!readonly);
        for (var prop in editorData) {
            if (editorData.hasOwnProperty(prop) && editorData[prop].editor) {
                editorData[prop].editor.updateOptions({ readOnly: readonly });
            }
        }
    }
}

function setSaveAndCloseVisible(visible) {
    if (visible === false) {
        $("#ddSaveAndClose").hide();
    } else {
        $("#ddSaveAndClose").show();
    }
}

//重新布局编辑器
function editorLayout() {
    for (var prop in editorData) {
        if (editorData.hasOwnProperty(prop) && editorData[prop].editor) {
            editorData[prop].editor.layout();
        }
    }
}

//注册事件(用户输入内容改变)
function initEvent() {
    for (var prop in editorData) {
        if (editorData.hasOwnProperty(prop)) {
            var editor = editorData[prop].editor;
            initDidChangeModelContentEvent(editor);
        }
    }
}

var isTriggerByBrackets;
//初始化注册值内容改变事件
function initDidChangeModelContentEvent(editorData) {
    if (editorData && editorData.isRegChangeEvent === false) {
        editorData.editor.onDidChangeModelContent(function (e) {
            isTriggerByBrackets = e.changes[0].text === '<';
            try {
                if (e.changes[0].text === ' ') {
                    vdk.default.debounceObject(function () {
                        editorData.editor.trigger('', 'editor.action.triggerSuggest', {});
                    }, 200);
                }

                vdk.default.debounceObject(function () {
                    executeCmdWithValue(cmdData.cacheChangedValue, getAllValue());
                }, 200);

                setEditorValueChanged();
            } catch (error) {
                console.log("值改变异常：" + error)
            }
            finally {
                isAnyValueChanged = true;
            }
        });
        editorData.isRegChangeEvent = true;
    }
}

var inputTimeoutTimer; //计时器
function setEditorValueChanged() {
    //触发值改变之前，清除重置之前的计时器
    if (inputTimeoutTimer)
        window.clearInterval(inputTimeoutTimer);

    //计算1s之后触发值改变
    inputTimeoutTimer = window.setTimeout(function () {
        if (isSaved) {
            isSaved = false;
            return;
        }

        var editor = getSelectedEditorData(null);
        if (editor && editor.editor) {
            vdk.default.debounceObject(function () {
                validationAll(false, editor.key);
            }, 1);

            if (vmonacoEditor) {
                vdk.default.debounceObject(function () {
                    vmonacoEditor.editorValueChanged(editor.key, winformToken, editor.editor.getValue());
                }, 1);
            }
        }

    }, 1000);
}

var setEditorFocusDelayTimer; //延时设置编辑器焦点计时器
function setEditorFocusDelay(editor) {
    //清除重置之前的计时器
    if (setEditorFocusDelayTimer)
        window.clearInterval(setEditorFocusDelayTimer);

    //计算1s之后触发值改变
    setEditorFocusDelayTimer = window.setTimeout(function () {
        if (editor === null || editor === undefined) {
            var editorData = getSelectedEditorData(null);
            if (editorData)
                editor = editorData.editor;
        }
        setEditorFocusByEditor(editor);
        if (editor && editor.getPosition)
            updateRowColumn(editor.getPosition());
    }, 200);
}

var suggustionDelayTimer; //延时设置编辑器焦点计时器
function setSuggustionDelayTimer(cmdFunction, delay) {
    //清除重置之前的计时器
    if (suggustionDelayTimer)
        window.clearInterval(suggustionDelayTimer);

    //计算1s之后触发值改变
    suggustionDelayTimer = window.setTimeout(cmdFunction, delay);
}

//自适应宽度
window.onresize = function () {
    editorLayout();
};

var isPageLoaed = false
window.onload = function () {
    console.log("onloaded")
    isPageLoaed = true
};

//键盘事件
$(document).ready(function () {

    $(document).ready(function () {
        $('#fixedOrFlowImg').click(function () {
            errorViewHandler.fixedOrFlow();
        });

        $('#errorCloseImg').click(function () {
            errorViewHandler.closeAction();
        });
    });

    $(window).keydown(keydownHandler);
    setTabTitle();

});

function keydownHandler(e) {

    if (vmonacoEditor && isEditorLoaded) {
        //var cmdId = null;
        if (e.keyCode === 83 && e.ctrlKey && e.shiftKey) {
            saveAndClose(true);//保存并关闭 ctrl+shift+s
            e.preventDefault();
            return;
        } else if (e.keyCode === 83 && e.ctrlKey) {
            saveEditor(true);//保存 ctrl+s
            e.preventDefault();
            return;
        } else if (event.keyCode === 116) {
            openPreview();//F5 打开预览
            e.preventDefault();
            return;
        } else if (event.keyCode === 123) {
            openDevTool();//F12 打开开发工具
            return;
        } else if (event.keyCode === 68 && e.shiftKey && e.altKey) {
            openDataSource(); //Shift+alt+ D 打开打开数据源
            return;
        } else if (event.keyCode === 69 && e.shiftKey && e.altKey) {
            openEvent();//Shift+alt + E 打开事件绑定
            return;
        } else if (event.keyCode === 79 && e.ctrlKey && !e.shiftKey) {
            openImport();//ctrl+O 打开事件绑定
            return;
        } else if (!e.altKey && e.shiftKey && ((event.keyCode === 80 && e.ctrlKey) || event.keyCode === 117)) {
            saveAndDeploy();//ctrl+shift+p 或者 shift+f6 保存并部署
            e.preventDefault();
            return;
        } else if (e.keyCode === 112 && !e.ctrlKey && e.shiftKey && !e.altKey) {  //快捷帮助shift + f1
            var selected = getSelectedEditorData(null);
            if (selected && (selected.key === editorKey.html) || selected.key === editorKey.template) {
                vuiHelp.openHelp(e, selected.model, selected.editor);
            }
        }
        // if (cmdId) {
        //     executeCmd(cmdId);
        // }
    }
}

function showSaved() {
    isAnyValueChanged = false;
    if (vm)
        vm.showSavedMessage();
}
