
/**
 * 获取是否dev模式
 * @returns {} 
 */
function IsDevEditorMode() {
    return editorMode === "dev";
}

/**
 * 获取url的参数
 * @returns {} 
 */
function getQueryString() {
    var qs = location.search.substr(1), // 获取url中"?"符后的字串  
        args = {}, // 保存参数数据的对象
        items = qs.length ? qs.split("&") : [], // 取得每一个参数项,
        item,
        len = items.length;

    for (var i = 0; i < len; i++) {
        item = items[i].split("=");
        var name = decodeURIComponent(item[0]),
            value = decodeURIComponent(item[1]);
        if (name) {
            args[name] = value;
        }
    }
    return args;
}

function setTabTitle() {
    //$(".ivu-tabs-tab").each(function (index, tab) {
    //var text = tab.innerText;
    //if (text === "template") {
    //tab.title = "刘小星星";
    //}
    // console.log(text);
    //});
}

$(function () {
    var srcPosiY = 0, destPosiY = 0, moveY = 0, destHeight = 30;

    //鼠标按下，记录按下位置和bind 移动和鼠标释放时间
    $("#expander").mousedown(function (e) {
        srcPosiY = e.pageY;
        $(document).bind("mousemove", mouseMove).bind("mouseup", mouseUp);

        e.preventDefault();
    });

    //移动事件
    function mouseMove(e) {
        var footstatusbar = errorViewHandler.errorViewJq();
        destPosiY = e.pageY;
        moveY = srcPosiY - destPosiY;
        srcPosiY = destPosiY;
        destHeight = footstatusbar.height() + moveY;

        var lastHeight = destHeight > 30 ? destHeight : 30;
        footstatusbar.css("height", lastHeight);
        $(".ivu-table-wrapper").css("height", lastHeight - 3);
        $(".ivu-table-body").css("height", lastHeight - 28);
    }
    //停止事件
    function mouseUp() {
        //卸载事件
        $(document).unbind("mousemove", mouseMove).unbind("mouseup", mouseUp);
    }
});

/**
 * 通过鼠标位置或者鼠标下面的值
 */
var getValueAtPoint = (function () {

    function getStateBeforeLine(lineNumber, model) {
        const tokenizationSupport = model._tokens.tokenizationSupport;
        var state = tokenizationSupport.getInitialState();

        for (let i = 1; i < lineNumber; i++) {
            var tokenizationResult = tokenizationSupport.tokenize(model.getLineContent(i), state, 0);
            state = tokenizationResult.endState;
        }

        return state;
    }

    function getTokensAtLine(lineNumber, model) {
        var tokenizationSupport = model._tokens.tokenizationSupport;
        var state = tokenizationSupport.getInitialState();

        for (let i = 1; i < lineNumber; i++) {
            var tokenizationResult = tokenizationSupport.tokenize(model.getLineContent(i), state, 0);
            state = tokenizationResult.endState;
        }

        var stateBeforeLine = state;
        var tokenizationResult1 = tokenizationSupport.tokenize(model.getLineContent(lineNumber), stateBeforeLine, 0);
        //var tokenizationResult2 = tokenizationSupport.tokenize2(model.getLineContent(lineNumber), stateBeforeLine, 0);

        return {
            startState: stateBeforeLine,
            tokens1: tokenizationResult1.tokens,
            //tokens2: tokenizationResult2.tokens,
            endState: tokenizationResult1.endState
        };
    }

    function getValue(model, position, isGetAttributeValue) {

        var data = getTokensAtLine(position.lineNumber, model);

        var token1Index = 0;
        for (var i = data.tokens1.length - 1; i >= 0; i--) {
            var t = data.tokens1[i];
            if (position.column - 1 >= t.offset) {
                token1Index = i;
                break;
            }
        }

        //var token2Index = 0;
        //for (var ii = (data.tokens2.length >>> 1) ; ii >= 0; ii--) {
        //    if (position.column - 1 >= data.tokens2[(ii << 1)]) {
        //        token2Index = ii;
        //        break;
        //    }
        //}

        //var result = '';

        var tokenText;
        if (token1Index < data.tokens1.length) {

            var lineContent = model.getLineContent(position.lineNumber);
            var tokenStartIndex = data.tokens1[token1Index].offset;
            var tokenEndIndex = token1Index + 1 < data.tokens1.length ? data.tokens1[token1Index + 1].offset : lineContent.length;
            if (isGetAttributeValue) {
                tokenStartIndex = tokenStartIndex + 1;
                tokenEndIndex = Math.max(tokenStartIndex, tokenEndIndex - 1);
            }
            tokenText = lineContent.substring(tokenStartIndex, tokenEndIndex);
        }

        return {
            value: tokenText,
            startColumn: tokenStartIndex + 1,
            endColumn: tokenEndIndex + 1
        };
    }

    return getValue;
})();
