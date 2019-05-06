
import defaultConfig from "./default-config.js"
import { linter } from "./eslint.js"


/**
 * Get the document URL of a rule.
 * @param {string} ruleId The rule ID to get.
 * @returns {string|null} The document URL of the rule.
 */
export function getRuleUrl(ruleId) {
    const rule = linter.getRules().get(ruleId)
    const meta = rule && rule.meta
    const docs = meta && meta.docs
    const url = docs && docs.url
    return url || null
}

var configTolintCache;
export default class PlaygroundState {

    constructor() {
        const config = Object.assign({}, defaultConfig)
        config.rules = Object.assign({}, defaultConfig.rules)
        config.parserOptions = Object.assign({}, defaultConfig.parserOptions)
        this.config = config

        const configTemp = Object.assign({}, this.config)
        configTemp.rules = Object.assign({}, this.config.rules)

        configTolintCache = configTemp;
    }

    /**
     * Actual config object to lint.
     * @type {object}
     */
    get _configToLint() {
        // Adjust the indentation options to the editor settings.

        //const config = Object.assign({}, this.config)
        //config.rules = Object.assign({}, this.config.rules)

        // const indentType = (this.indentType === "space") ? this.indentSize : "tab"
        // rules.indent = [rules.indent, indentType]
        // rules["vue/html-indent"] = [rules["vue/html-indent"], indentType]

        //return config
        return configTolintCache
    }

    lint(code) {

        const config = this._configToLint
        var msg = null;

        try {
            // Lint
            //vm.eslintVerifyMessage =
            msg = linter.verify(code, config)
        }
        catch (err) {
            //vm.eslintVerifyMessage =
            msg = [{
                fatal: true,
                severity: 2,
                message: err.message,
                line: 1,
                column: 0,
            }]
        }
        return msg;

        // Fix
        // try {
        //     const ret = linter.verifyAndFix(this.code, config)
        //     this.fixedCode = ret.output
        //     this.fixedMessages = ret.messages
        // }
        // catch (err) {
        //     this.fixedCode = this.code
        //     this.fixedMessages = [{
        //         fatal: true,
        //         severity: 2,
        //         message: err.message,
        //         line: 1,
        //         column: 0,
        //     }]
        // }
    }
}
