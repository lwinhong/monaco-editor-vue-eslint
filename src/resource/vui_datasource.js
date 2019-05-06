/*********************JSON数据**************************/

var vuiDataJson = '#JSON#';
var commonProps = '#COMMONPROPS#';
var vuiPropOptions = '#VUIPROPOPTIONS#';
var existCodes = '#EXISTCODES#';
var entitiesDataJson = '#ENTITIES#';
var referenceComponents = '#REFCOMPS#';
var currentComponent = '#CURRENTCOMP#';
var viewState = '#VIEWSTATE#';
var scriptResources = '#SCRIPTRESOURCES#';
var componentThemeVarDataJson = '#THEMEVARJSON#';

//这种方式可以用
//$.getJSON("t.json", function (data) {
//    console.log(data);
//})

/**************************************************/

var divCode = 'JGDiv';
var componentThemeVarDataCache;

/**
 * 数据源处理
 */
var vuiDataSourceHandler = (function () {

    var vuiDataCache = null; //标签数据
    var vuiPropValuesCache = null; //属性值选项
    var vuiCommonPropsCache = null; //公共的属性
    var existControlCodeCache = null; //已存在的控件Code
    var existEventCodeCaches; //已存在的数据绑定数据
    var viewStateCaches;

    /**
     * 获取vui标签json数据
     * @returns {json对象} 
     */
    function vuiJsonData() {
        if (vuiDataCache)
            return vuiDataCache;

        $.getJSON(vuiDataJson, "", function (data) {
            vuiDataCache = data;
        });
        return vuiDataCache;//= JSON.parse(vuiDataJson);
    }
    vuiJsonData();
    /**
     * 获取vui属性值数据
     * @returns {} 
     */
    function vuiPropValuesJsonData() {
        if (vuiPropValuesCache)
            return vuiPropValuesCache;
        return vuiPropValuesCache = JSON.parse(vuiPropOptions);
    }

    /**
     * 获取vui列表（工具箱）
     * @returns {} 
     */
    function getVuiListForMenu() {
        var data = vuiJsonData();
        if (data) {
            var result = new Array();
            var index = 0;
            $.each(data,
                function (vui, vuidata) {
                    result[index++] = { name: vui, title: vuidata.label };
                });
            return result;
        }
        return [];
    }

    /**
     * 获取公共属性数据
     * @returns {} 
     */
    function vuiCommonPropsJsonData() {
        if (vuiCommonPropsCache)
            return vuiCommonPropsCache;
        return vuiCommonPropsCache = JSON.parse(commonProps);
    }

    /**
     * 窗体中所有的控件编码数据
     * @returns {} 
     */
    function existControlCodeJsonData() {
        if (existControlCodeCache)
            return existControlCodeCache;
        try {
            return existControlCodeCache = JSON.parse(existCodes);
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    /**
     * 提供给窗体设置已存在的事件绑定相关数据
     * @param {} json 
     * @returns {} 
     */
    function setEventCodes(json) {
        try {
            existEventCodeCaches = JSON.parse(json);
        } catch (e) {
            console.log(e);
        }
    }

    /**
     * 根据vlang的编码获取相应的数据
     * @param {} code 
     * @returns {} 
     */
    function getVlangWithCode(code) {
        var vlang = vuiCommonPropsJsonData();
        if (!vlang)
            return null;

        var result = null;
        var isExist = vlang[code];
        if (isExist) {
            result = isExist;
        } else {
            $.each(vlang,
                function (com, data) {
                    if (com.equalIgnoreCase(code)) {
                        result = data;
                        return false;
                    }
                    return true;
                });
        }
        return result;
    }

    /**
     * 提供给窗体设置已存在的事件绑定相关数据
     * @param {} json 
     * @returns {} 
     */
    function getViewState(key) {
        try {
            if (!viewStateCaches)
                viewStateCaches = JSON.parse(viewState);
            if (viewStateCaches && viewStateCaches[key])
                return viewStateCaches[key];
        } catch (e) {
            console.log(e);
        }
        return null;
    }

    /**
     * 获取页签下标
     * @returns {} 
     */
    function getTabIndexState() {
        try {
            return getViewState("selectedIndex");
        } catch (e) {
            console.log(e);
        }
        return null;
    }

    /**
     * 获取script资源
     * @returns {} 
     */
    function getScriptResources() {
        try {
            var all = JSON.parse(scriptResources);
            return all;
        } catch (e) {
            console.log(e);
        }
        return null;
    }

    /**
    * 获取themeVar json数据
    * @returns {json对象} 
    */
    function getComponentThemeVarData() {
        if (componentThemeVarDataCache)
            return componentThemeVarDataCache;

        $.getJSON(componentThemeVarDataJson, "", function (data) {
            componentThemeVarDataCache = data;
        });
        return componentThemeVarDataCache;
    }
    getComponentThemeVarData();

    function initDataSource() {
        vuiDataCache = null; //标签数据
        vuiPropValuesCache = null; //属性值选项
        vuiCommonPropsCache = null; //公共的属性
        existControlCodeCache = null; //已存在的控件Code
        existEventCodeCaches = null; //已存在的数据绑定数据
        componentThemeVarDataCache = null;
    }

    return {
        vuiJsonData: vuiJsonData,
        getVuiListForMenu: getVuiListForMenu,
        vuiPropValuesJsonData: vuiPropValuesJsonData,
        vuiCommonPropsJsonData: vuiCommonPropsJsonData,
        existControlCodeJsonData: existControlCodeJsonData,
        setEventCodes: setEventCodes,
        getVlangWithCode: getVlangWithCode,
        initDataSource: initDataSource,
        getViewState: getViewState,
        getTabIndexState: getTabIndexState,
        getScriptResources: getScriptResources,
        getComponentThemeVarData: getComponentThemeVarData
    };
})();