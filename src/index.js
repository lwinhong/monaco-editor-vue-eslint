import debounce from "lodash/debounce"
import eslintState from "./app-state/eslint-state"
import emmetHTML from "./emmet/monaco-emmet"
import { getRuleUrl } from "./app-state/eslint-state"
import v3config from "./app-state/v3-config"
import themeVar from './resource/themeVar_intelliSense_handler'
import htmlparser from 'htmlparser2'
const vueTempCompiler = require("vue-template-compiler")

const suggestRules = v3config.suggest
const playgroundState = new eslintState()

/**
 * 异步执行函数
 * @param {执行函数} func 
 * @param {超时} timeout 
 * @param {回调函数} callBack 
 */
const debounceObject = function (func, timeout, callBack) {
    const doDebounce = debounce(() => {
        if (func)
            func()
        if (callBack)
            callBack()
    }, timeout)
    doDebounce()
}

/**
 * 更新eslint信息（异步）
 * @param {monaco editor} editor 
 * @param {回调函数} callBack 
 */
const invalidateEslintDebounce = function (editor, callBack) {
    debounceObject(function () {
        var msg = invalidateEslint(editor);
        if (callBack)
            callBack(msg)
    }, 1);
}

/**
 * 更新eslint信息（同步）
 * @param {monaco editor} editor 
 */
const invalidateEslint = (editor) => {
    if (editor) {
        const model = editor.getModel()
        const value = model.getValue()

        var lintValue = value;
        if (editorData) {
            if (editorData[editorKey.script] && editorData[editorKey.script].model == model)
                lintValue = "<script>\n " + value + "\n </script>"
            else if (editorData[editorKey.template] && editorData[editorKey.template].model == model)
                lintValue = "<template>\n " + value + "\n </template>"
        }

        var msg = playgroundState.lint(lintValue)
        return msg;
    }
    return null;
}

/**
 * Ensure that a given value is a positive value.
 * @param {number|undefined} value The value to check.
 * @param {number} defaultValue The default value which is used if the `value` is undefined.
 * @returns {number} The positive value as the result.
 */
function ensurePositiveInt(value, defaultValue) {
    return Math.max(1, (value !== undefined ? value : defaultValue) | 0)
}

/**
 * Convert a message of ESLint to a marker of MonacoEditor.
 * @param {ESLintMessage} message The message to convert.
 * @returns {monaco.editor.IMarkerData} The marker data.
 */
function messageToMarker(message) {
    const startLineNumber = ensurePositiveInt(message.line - 1, 1)
    const startColumn = ensurePositiveInt(message.column, 1)
    const endLineNumber = ensurePositiveInt(message.endLine - 1, startLineNumber)
    const endColumn = ensurePositiveInt(message.endColumn, startColumn + 1)

    var severity = monaco.MarkerSeverity.Error
    var source = "ESLint"
    var msg = message.message
    if (suggestRules && $.inArray(message.ruleId, suggestRules) >= 0) {
        severity = monaco.MarkerSeverity.Hint
        source = null
        msg += ` (${message.ruleId || "FATAL"})`;
    }

    return {
        severity: severity,
        source: source,
        //message: `${message.message} (${message.ruleId || "FATAL"})`,
        //message: `${message.message} (<a :href="${getRuleUrl(m.ruleId)}" target="_blank" v-if="${m.ruleId} != null" rel="noopener">{{ ${m.ruleId} }}</a><span v-else>FATAL</span>)`,
        message: msg,
        ruleId: message.ruleId,
        ruleUrl: getRuleUrl(message.ruleId) + "#readme",
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn,
        position: {
            startLineNumber: startLineNumber,
            startColumn: startColumn,
            endLineNumber: endLineNumber,
            endColumn: endColumn
        }
    }
}

/**
 * Update the markers of a given editor.
 * @param {monaco.editor.IStandaloneEditor} editor The editor to update.
 * @param {ESLintMessage[]} messages The messages of new markers.
 * @returns {void}
 */
function updateMarkers(editor, messages) {
    const model = editor.getModel()
    const id = editor.getId()
    const markers = buildMarkers(messages)

    monaco.editor.setModelMarkers(model, id, markers)
    return markers
}

/**
 * eslint msg to monaco.editor markers
 * @param {ESLintMessage[]} messages 
 */
function buildMarkers(messages) {
    const markers = messages.map(messageToMarker)
    return markers
}

function parseComponentVue(source) {
    try {
        var pc = vueTempCompiler.parseComponent(source.VueComponent)
        if (pc.template)
            source.Template = pc.template.content.trim()
        if (pc.script)
            source.Script = pc.script.content.trim()
        //console.log("parse:" + source.Template)
    } catch (error) {
        console.error(error)
    }
}

export default {
    emmetHTML,
    invalidateEslintDebounce,
    invalidateEslint,
    debounceObject,
    updateMarkers,
    themeVar,
    htmlparser,
    parseComponentVue
}

