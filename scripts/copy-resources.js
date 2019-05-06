"use strict"

const childProcess = require("child_process")
const args = process.argv.slice(2)
const root = "src/"
const files = [
    "css/iview.editor.css",
    "css/iviewindex.css",

    "iview/fonts/ionicons.eot",
    "iview/fonts/ionicons.svg",
    "iview/fonts/ionicons.ttf",
    "iview/fonts/ionicons.woff",
    "iview/iview.css",
    "iview/iview.min.js",
    "iview/vue.min.js",

    "resource/componentThemeVarPath.json",
    "resource/css_intelliSense_handler.js",
    "resource/editor_util.js",
    "resource/iview.editor.js",
    "resource/jquery-3.3.1.js",
    "resource/script_intelliSense_handler.js",
    "resource/tmp2935.js",
    "resource/VDevprojHandler.js", 
    "resource/vui_datasource.js",
    "resource/vui_help.js",
    "resource/vui_hover_handler.js",
    "resource/vui_intelliSense_handler.js",
    "resource/vui_prototype.js",
    "resource/vui_save_handler.js",
    "resource/vui_validation.js",
    "resource/vui-chart_handler.js",
    "resource/images/icon-enter-dark.png",
    "resource/images/icon-enter-light.png",
    "resource/images/icon-prop-dark.png",
    "resource/images/icon-prop-light.png",
    "resource/images/waitting.gif",
    "iviewindex.js",

    "resource/dataSource/global/ThemeVar.json",
    "resource/dataSource/global/VLanguage.json",
    "resource/dataSource/global/VuiPropOption.json",
    "resource/dataSource/global/VuiTag.json",

    "resource/dataSource/local/Entities.json",
    "resource/dataSource/local/Resource.json",
]
const binFile = "node_modules/cpx/bin/index.js"
const glob = `${root}{${files.join(",")}}`
const dist = "dist"

console.log("> cpx", glob, dist, ...args)
const cp = childProcess.spawn(
    process.execPath,
    [binFile, glob, dist, ...args],
    { stdio: "inherit" }
)
cp.on("exit", (exitCode) => {
    process.exitCode = exitCode
})
