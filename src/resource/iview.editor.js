
var vm = new Vue({
    el: '#app',
    data: {
        selectedIndex: editorKey.html,
        tabs: [],
        visible: false,
        errorMsgColumn: [
            {
                type: "index",
                width: 50,
                align: "center"
            },
            {
                title: "说明",
                key: "desc",
                render: renderErrorMsgTable
            },
            { title: "行", width: 50, key: "row" },
            { title: "列", width: 50, key: "column" },
            // { title: "类型", width: 50, key: "severity" },
            { title: "模块", width: 100, key: "moduleName" }
        ],
        errorData: [],
        vuiMenuData: [],
        eslintVerifyMessage: [],
        editor: null
    },
    created: function () {
        this.$Message.config({
            top: 38,
            duration: 1
        });
    },
    updated: function () {
        if (this.tabs && this.tabs.length > 3 && !isGolobalEditorLoaded) {
            if (editorMode === "default")
                loadMonacoGlobalEditor();
            isGolobalEditorLoaded = true;
        }
    },
    methods: {
        handleOpen: function () {
            this.visible = true;
        },
        handleClose: function () {
            this.visible = false;
        },
        deployMessgge: function () {
            this.$Message.success({
                content: "正在部署",
                duration: 2
            });
        },
        deployDone: function () {
            this.$Message.success({
                content: "部署完成",
                duration: 2
            });
        },
        showSavedMessage: function () {
            this.$Message.success({
                content: "保存完成",
                duration: 1
            });
        },
        showSavedErrorMessage: function (saveCallBack, showMsg) {
            if (showMsg) {
                this.$Message.error({
                    content: "保存失败,详细查看状态栏",
                    duration: 2
                });
            } else {
                this.$Modal.confirm({
                    title: "错误",
                    //content: '<p>保存失败,详细查看错误列表</p>',
                    okText: "取消",
                    cancelText: "继续保存",
                    width: "420",
                    closable: true,
                    onCancel: () => {
                        if (saveCallBack)
                            saveCallBack(false);
                    },
                    render: (h) => {
                        return h("div",
                            {
                                style: {
                                    color: "red",
                                    fontSize: "14px",
                                    paddingTop: "12px"
                                }
                            },
                            [
                                h("icon",
                                    {
                                        props: {
                                            type: "close-circled",
                                            color: "red",
                                            size: "35"
                                        },
                                        style: {
                                            verticalAlign: "middle"
                                        }
                                    }),
                                h("span",
                                    {
                                        style: {
                                            verticalAlign: "middle",
                                            padding: "0 0 0 16px"
                                        }
                                    },
                                    "保存失败,详细查看错误列表")
                            ]);
                    }
                });
            }
        },
        localError: localError,
        changeTheme: function (e) {
            if (monaco && monaco.editor)
                monaco.editor.setTheme(e);
        },
        invalidate(editorData, editor, callBack) {
            this.editor = editor;
            // this.invalidate_(editor, callBack);
            var eslintMessage = window.vdk.default.invalidateEslint(editor);
            var markers = window.vdk.default.updateMarkers(editor, eslintMessage);
            if (markers) {
                for (var i = 0; i < markers.length; i++) {
                    var marker = markers[i];
                    if (marker.severity == monaco.MarkerSeverity.Error)
                        addErrorInfo(marker.message, marker.position, editorData.key, marker.ruleUrl, marker.ruleId);
                    // else if (marker.severity == monaco.MarkerSeverity.Warning) {
                    //     addVerifyData(warningData, marker.message, marker.position, editorData.key, marker.ruleUrl, marker.ruleId, "warning");
                    // }
                }
            }
            if (callBack)
                callBack();
        }
    },
    watch: {
        // eslintVerifyMessage: function (val) {
        //     if (this.eslintStatue) {
        //         const editor = this.editor;
        //         var markers = this.eslintStatue.updateEditorMarker(editor, this.eslintVerifyMessage);
        //         //todo add error to errorlist
        //         if (markers) {
        //             for (var i = 0; i < markers.length; i++) {
        //                 var marker = markers[i];
        //                 addErrorInfo(marker.message, marker.position, editorKey.template);
        //             }
        //         }
        //     }
        // }

        selectedIndex: function (newValue, oldValue) {
            if (window.vdk && window.vdk.default)
                window.vdk.default.debounceObject(function () {
                    onMonacoEditorIndexChanged();
                }, 20);
        }
    }
});

function renderErrorMsgTable(h, params) {

    const icon = renderErrorIcon(h, params);
    const span = h("span", {
        style: {
            verticalAlign: "middle",
            paddingLeft: "3px"
        }
    }, params.row.desc);

    var elements = [icon, span];
    if (params.row.ruleUrl) {
        const a = h("a", {
            attrs: {
                href: "javascript: void(0);",
                // target: "_blank",
                // rel: "noopener",
                title: params.row.ruleUrl
            },
            on: {
                click: () => {
                    executeCmdWithValue(cmdData.openValidateRule, params.row.ruleUrl)
                }
            }
        }, ` (${params.row.ruleId})`);
        elements.push(a);
    }

    return h("div", elements);
}

function renderErrorIcon(h, params) {
    // const icon = h("Icon", {
    //     props: {
    //         type: params.row.severity === monaco.MarkerSeverity.Error ? "close-circled" : "ios-information-circle",
    //         color: params.row.severity === monaco.MarkerSeverity.Error ? "red" : "green"
    //     }
    // });

    const icon = h("Icon", {
        props: {
            type: "close-circled",
            color: "red"
        }
    });

    return icon;
}
