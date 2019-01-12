function render() {
    let html = document.getElementById("editor").value;
    html = scriptRender(html);
    html = html.replace(/[\n]/g, "<br/>");
    let viewer = document.getElementById("viewer");
    viewer.innerHTML = html;
}

function scriptRender(html) {
    let indexSup = html.indexOf("^");
    let indexSub = html.indexOf("_");
    let newHtml = html;
    while (indexSup + indexSub != -2) {
        if (indexSup != -1 && (indexSup < indexSub || indexSub == -1)) {
            newHtml = replaceScripts(newHtml, indexSup, "^");
        } else if (indexSub != -1 && (indexSub < indexSup || indexSup == -1)) {
            newHtml = replaceScripts(newHtml, indexSub, "_");
        }
        indexSup = newHtml.indexOf("^");
        indexSub = newHtml.indexOf("_");
    }
    return newHtml;
}

function replaceScripts(newHtml, index, char) {
    let charBool = char == "_";
    let stag =  charBool ? "<sub>" : "<sup>";
    let etag = charBool ? "</sub>" : "</sup>";
    let opp = charBool ? "^" : "_";
    let pre = newHtml.slice(0, index);
    let middle = "";
    let post = "";
    if (!checkDouble(newHtml, opp, index)) {
        let res = scriptContents(newHtml, index);
        if (res[1]) {
            middle = stag + res[0] + etag;
            post = newHtml.slice(res[1]);
        } else {
            middle = stag + etag;
            post = res[0];
        }
    } else {
        let spanStag = "<span class = 'supsub'>";
        let spanEtag = "</span>";
        let stag = charBool ? "<sub class='subscript'>" : "<sup class='superscript'>";
        let oppStag = charBool ? "<sup class='superscript'>" : "<sub class='subscript'>";
        let oppEtag = charBool ? "</sup>" : "</sub>";
        let res = scriptContents(newHtml, index);
        if (res[1]) {
            middle = spanStag;
            let str = stag + res[0] + etag;
            let oppStr;
            let oppRes = scriptContents(newHtml, res[1]);
            if (oppRes[1]) {
                oppStr = oppStag + oppRes[0] + oppEtag;
                post = newHtml.slice(oppRes[1]);
            } else {
                oppStr = oppStag + oppEtag;
                post = oppRes[0];
            }

            if (opp == "_") {
                middle +=  str + oppStr + spanEtag;
            } else {
                middle += oppStr + str + spanEtag;
            }
        } else {
            middle = spanStag + stag + etag + oppStag + oppEtag + spanEtag;
            post = res[0];
        }
    }
    newHtml = pre + middle + post;
    return newHtml;
}

function checkDouble(html, opp, sInd) {
    if (html.slice(sInd+1, sInd+2) != "{") {
        let chk = html.slice(sInd + 2, sInd + 3);
        return chk == opp;
    } else {
        let end = html.indexOf("}", sInd);
        if (end == -1) {
            return false;
        }
        let chk = html.slice(end + 1, end + 2);
        return chk == opp;
    }
}

function scriptContents(html, index) {
    let nextChar = html.slice(index + 1, index + 2);
    let indexEnd = index+2;
    let ret;
    if (nextChar != "{") {
        ret = nextChar;
    } else {
        let endChar = html.indexOf("}", indexEnd);
        if (endChar <= index + 1) {
            return [html.slice(index+2)];
        }
        ret = html.slice(index+2, endChar);
        indexEnd = endChar+1;
    }
    return [ret, indexEnd];
}

// Σ <span class='supsub'><sup class='superscript'>n</sup><sub class='subscript'>i=1</sub></span> x<sub>i</sub>, σ <br>