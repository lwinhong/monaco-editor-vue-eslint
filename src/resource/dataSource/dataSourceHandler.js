import dsPath from './dataSourcePath'

var themeVarData
var vlanguageData
var vuiPropOptionData
var vuiTagData
var scriptResourceData

var entitiesData
var resourceData
var viewStateData
var existWindowControlCodeData

/**
 * 获取json数据
 * @param {json路径} path 
 * @param {回调返回数据} callback 
 */
const getJsonData = (path, callback) => {
    $.getJSON(path, '', function (data) {
        if (callback)
            callback(data);
    })
}

/**
 * 初始化全局数据（）
 */
const initGlobalDs = () => {
    getJsonData(dsPath.themeVarJsonPath, function (data) {
        themeVarData = data
    })
    getJsonData(dsPath.vlanguageJsonPath, function (data) {
        vlanguageData = data
    })
    getJsonData(dsPath.vuiPropOptionJsonPath, function (data) {
        vuiPropOptionData = data
    })
    getJsonData(dsPath.vuiTagJsonPath, function (data) {
        vuiTagData = data
    })
    getJsonData(dsPath.scriptResourcePath, function (data) {
        scriptResourceData = data
    })
}

/**
 * 初始化局部数据(实体，资源)
 */
const initlocalDs = () => {
    getJsonData(dsPath.entitiesJsonPath, function (data) {
        entitiesData = data
    })
    getJsonData(dsPath.resourceJsonPath, function (data) {
        resourceData = data
    })
    getJsonData(dsPath.viewStatePath, function (data) {
        viewStateData = data
    })
    getJsonData(dsPath.existWindowControlCodePath, function (data) {
        existWindowControlCodeData = data
    })
}

/**
 * 初始化全部数据源
 */
const initDs = () => {
    initGlobalDs();
    initlocalDs();
}

const getDataSource = () => {
    return {
        themeVarData, vlanguageData, vuiPropOptionData, vuiTagData, scriptResourceData,
        entitiesData, resourceData, viewStateData, existWindowControlCodeData
    }
}

export default {
    getJsonData, initDs, initGlobalDs, initlocalDs, getDataSource
}