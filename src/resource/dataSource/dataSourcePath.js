const dsDir = './resource/datasource'
const global = `${dsDir}/global`
const local = `${dsDir}/local/${divFlag}`

/******* 项目级别的数据 *******/
const themeVarJsonPath = `${global}/ThemeVar.json`
const vlanguageJsonPath = `${global}/VLanguage.json`
const vuiPropOptionJsonPath = `${global}/VuiPropOption.json`
const vuiTagJsonPath = `${global}/VuiTag.json`
const scriptResourcePath = `${global}/ScriptResources.json`

/******* 构件和窗体的数据 *******/
const entitiesJsonPath = `${local}/Entities.json`
const resourceJsonPath = `${local}/Resource.json`
const viewStatePath = `${local}/ViewState.json`
const existWindowControlCodePath = `${local}/ExistWindowControlCode.json`

export default {
    themeVarJsonPath,
    vlanguageJsonPath,
    vuiPropOptionJsonPath,
    vuiTagJsonPath,
    scriptResourcePath,

    entitiesJsonPath,
    resourceJsonPath,
    viewStatePath,
    existWindowControlCodePath
}